#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import yaml from 'js-yaml';
import {
  appendHistoryRows,
  appendToPipeline,
  buildExcludedCompanyFilter,
  buildIcExceptionFilter,
  buildTitleFilter,
  isObviousJobgetherNonFit,
  loadSeenCompanyRoles,
  loadSeenUrls,
  normalizeExternalJobUrl,
  normalizeText,
} from './scan-utils.mjs';

const PORTALS_PATH = 'portals.yml';
const PIPELINE_PATH = 'data/pipeline.md';
const SCAN_HISTORY_PATH = 'data/scan-history.tsv';

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

function companyRoleKey(company, title) {
  return `${normalizeText(company).toLowerCase()}::${normalizeText(title).toLowerCase()}`;
}

function loadJobgetherSeenState() {
  const offerUrls = new Set();
  const companyRoles = new Set();

  if (existsSync(SCAN_HISTORY_PATH)) {
    const lines = readFileSync(SCAN_HISTORY_PATH, 'utf-8').split('\n');
    for (const line of lines.slice(1)) {
      const cells = line.split('\t').map((cell) => normalizeText(cell));
      if (cells.length < 6 || cells[2].toLowerCase() !== 'jobgether') continue;
      if (cells[0].includes('jobgether.com/offer/')) offerUrls.add(cells[0]);
      if (cells[3] && cells[4]) companyRoles.add(companyRoleKey(cells[4], cells[3]));
    }
  }

  if (existsSync(PIPELINE_PATH)) {
    const lines = readFileSync(PIPELINE_PATH, 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.startsWith('- [')) continue;
      const cells = line.split('|').map((cell) => normalizeText(cell));
      const urlIndex = cells.findIndex((cell) => /^<?https?:\/\//.test(cell));
      if (urlIndex < 0 || !cells[urlIndex + 1] || !cells[urlIndex + 2]) continue;
      companyRoles.add(companyRoleKey(cells[urlIndex + 1], cells[urlIndex + 2]));
    }
  }

  return { offerUrls, companyRoles };
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

    if (helpers.excludedCompanyFilter(item.company)) {
      const result = {
        ...item,
        normalizedUrl,
        status: 'skipped_invalid',
      };
      result.cleanupAction = 'Leave Alone';
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

    const obviousNonFit = isObviousJobgetherNonFit(
      item.title,
      item.company,
      helpers.titleFilter,
      helpers.icExceptionFilter,
      helpers.portals,
    );

    if (obviousNonFit) {
      const result = {
        ...item,
        normalizedUrl,
        status: 'skipped_invalid',
        cleanupAction: 'Not Interested',
      };
      results.push(result);
      historyRows.push({
        url: normalizedUrl,
        source: 'Jobgether',
        title: item.title,
        company: item.company,
        status: 'skipped_invalid',
      });
      continue;
    }

    const roleKey = companyRoleKey(item.company, item.title);
    const duplicate = helpers.seenUrls.has(normalizedUrl)
      || helpers.seenCompanyRoles.has(roleKey)
      || helpers.jobgetherSeenOfferUrls.has(item.jobgetherOfferUrl);
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
      helpers.seenCompanyRoles.add(roleKey);
      if (item.jobgetherOfferUrl) helpers.jobgetherSeenOfferUrls.add(item.jobgetherOfferUrl);
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
  const jobgetherSeenState = loadJobgetherSeenState();
  const seenCompanyRoles = loadSeenCompanyRoles();
  for (const roleKey of jobgetherSeenState.companyRoles) seenCompanyRoles.add(roleKey);
  const helpers = {
    portals,
    titleFilter: buildTitleFilter(portals?.title_filter),
    icExceptionFilter: buildIcExceptionFilter(portals?.title_filter),
    excludedCompanyFilter: buildExcludedCompanyFilter(portals?.title_filter),
    seenUrls: loadSeenUrls(),
    seenCompanyRoles,
    jobgetherSeenOfferUrls: jobgetherSeenState.offerUrls,
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
