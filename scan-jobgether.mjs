#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import yaml from 'js-yaml';
import {
  appendHistoryRows,
  appendToPipeline,
  buildIcExceptionFilter,
  buildTitleFilter,
  isObviousJobgetherNonFit,
  loadSeenCompanyRoles,
  loadSeenUrls,
  normalizeExternalJobUrl,
  normalizeText,
} from './scan-utils.mjs';

const PORTALS_PATH = 'portals.yml';

function parseArgs(argv) {
  const args = { dryRun: false, stdin: false, input: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--stdin') args.stdin = true;
    else if (arg === '--input') {
      args.input = argv[index + 1];
      index += 1;
    }
  }

  if (args.stdin && args.input) {
    throw new Error('Use either --input <file> or --stdin, not both');
  }

  if (argv.includes('--input') && !args.input) {
    throw new Error('Missing value for --input');
  }

  return args;
}

function readPayload(args) {
  if (args.stdin) {
    return JSON.parse(readFileSync(0, 'utf-8'));
  }

  if (args.input) {
    return JSON.parse(readFileSync(args.input, 'utf-8'));
  }

  throw new Error('Provide --input <file> or --stdin');
}

function loadPortalsConfig() {
  if (!existsSync(PORTALS_PATH)) return null;
  return yaml.load(readFileSync(PORTALS_PATH, 'utf-8'));
}

function normalizeItem(item) {
  return {
    company: normalizeText(item.company),
    title: normalizeText(item.title),
    externalUrl: normalizeText(item.externalUrl),
    jobgetherOfferUrl: normalizeText(item.jobgetherOfferUrl),
  };
}

function buildCleanupAction(status, item, helpers) {
  if (status === 'skipped_dup') return "I'm Interested";
  if (status === 'skipped_invalid') return 'Leave Alone';

  const obviousNonFit = isObviousJobgetherNonFit(
    item.title,
    item.company,
    helpers.titleFilter,
    helpers.icExceptionFilter,
    helpers.portals,
  );

  return obviousNonFit ? 'Not Interested' : "I'm Interested";
}

function processItems(items, helpers) {
  const results = [];
  const newOffers = [];
  const historyRows = [];

  for (const rawItem of items) {
    const item = normalizeItem(rawItem);
    const normalizedUrl = normalizeExternalJobUrl(item.externalUrl);
    const historyUrl = normalizedUrl || item.externalUrl || item.jobgetherOfferUrl;

    if (!item.company || !item.title || !item.externalUrl) {
      const result = {
        ...item,
        normalizedUrl,
        status: 'skipped_invalid',
      };
      result.cleanupAction = buildCleanupAction(result.status, result, helpers);
      results.push(result);

      if (historyUrl) {
        historyRows.push({
          url: historyUrl,
          source: 'Jobgether',
          title: item.title || '(missing title)',
          company: item.company || '(missing company)',
          status: 'skipped_invalid',
        });
      }
      continue;
    }

    const companyRoleKey = `${item.company.toLowerCase()}::${item.title.toLowerCase()}`;
    const duplicate = helpers.seenUrls.has(normalizedUrl) || helpers.seenCompanyRoles.has(companyRoleKey);
    const status = duplicate ? 'skipped_dup' : 'added';

    const result = {
      ...item,
      normalizedUrl,
      status,
    };
    result.cleanupAction = buildCleanupAction(status, result, helpers);
    results.push(result);

    if (status === 'added') {
      helpers.seenUrls.add(normalizedUrl);
      helpers.seenCompanyRoles.add(companyRoleKey);
      newOffers.push({
        company: item.company,
        title: item.title,
        url: normalizedUrl,
      });
    }

    historyRows.push({
      url: normalizedUrl,
      source: 'Jobgether',
      title: item.title,
      company: item.company,
      status,
    });
  }

  return { results, newOffers, historyRows };
}

function buildOutput(date, results) {
  const summary = {
    received: results.length,
    added: results.filter((result) => result.status === 'added').length,
    skipped_dup: results.filter((result) => result.status === 'skipped_dup').length,
    skipped_invalid: results.filter((result) => result.status === 'skipped_invalid').length,
  };

  return { date, results, summary };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Input payload must be a JSON object');
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = readPayload(args);
  validatePayload(payload);
  const items = Array.isArray(payload.items) ? payload.items : [];
  const portals = loadPortalsConfig();
  const helpers = {
    portals,
    titleFilter: buildTitleFilter(portals?.title_filter),
    icExceptionFilter: buildIcExceptionFilter(portals?.title_filter),
    seenUrls: loadSeenUrls(),
    seenCompanyRoles: loadSeenCompanyRoles(),
  };

  const { results, newOffers, historyRows } = processItems(items, helpers);
  const date = new Date().toISOString().slice(0, 10);

  if (!args.dryRun) {
    appendToPipeline(newOffers);
    appendHistoryRows(historyRows, date);
  }

  process.stdout.write(`${JSON.stringify(buildOutput(date, results), null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
