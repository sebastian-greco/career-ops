#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import yaml from 'js-yaml';
import {
  appendHistoryRows,
  appendToPipeline,
  buildExcludedCompanyFilter,
  buildIcExceptionFilter,
  buildTitleFilter,
  isObviousFeedNonFit,
  loadSeenCompanyRoles,
  loadSeenUrls,
  normalizeExternalJobUrl,
  normalizeText,
} from './scan-utils.mjs';

const PORTALS_PATH = 'portals.yml';

function parseArgs(argv) {
  const args = {
    dryRun: false,
    input: null,
    limit: 10,
    stdin: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--stdin') args.stdin = true;
    else if (arg === '--input') args.input = argv[++index];
    else if (arg === '--limit') args.limit = Number.parseInt(argv[++index], 10);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.stdin && args.input) throw new Error('Use either --input <file> or --stdin, not both');
  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
    throw new Error('--limit must be an integer between 1 and 100');
  }
  if (argv.includes('--input') && !args.input) throw new Error('Missing value for --input');
  return args;
}

function readInput(args) {
  if (args.stdin) return JSON.parse(readFileSync(0, 'utf-8'));
  if (args.input) return JSON.parse(readFileSync(args.input, 'utf-8'));
  return null;
}

function loadPortalsConfig() {
  if (!existsSync(PORTALS_PATH)) return null;
  return yaml.load(readFileSync(PORTALS_PATH, 'utf-8'));
}

function normalizeItem(item) {
  return {
    company: normalizeText(item?.company),
    title: normalizeText(item?.title),
    externalUrl: normalizeText(item?.externalUrl),
    wttjJobUrl: normalizeText(item?.wttjJobUrl),
    acceptsInternalApplications: item?.acceptsInternalApplications === true,
  };
}

function buildCleanupAction(status) {
  if (status === 'skipped_non_fit') return 'Not Interested';
  if (status === 'skipped_invalid') return 'Leave Alone';
  return 'Save';
}

function processItems(items, helpers) {
  const results = [];
  const newOffers = [];
  const historyRows = [];

  for (const rawItem of items) {
    const item = normalizeItem(rawItem);
    const normalizedUrl = normalizeExternalJobUrl(item.externalUrl);
    const historyUrl = normalizedUrl || item.wttjJobUrl;
    let status;

    if (!item.company || !item.title) status = 'skipped_invalid';
    else if (helpers.excludedCompanyFilter(item.company)) status = 'skipped_non_fit';
    else if (isObviousFeedNonFit(
      item.title,
      item.company,
      helpers.titleFilter,
      helpers.icExceptionFilter,
      helpers.portals,
    )) status = 'skipped_non_fit';
    else if (!normalizedUrl) status = 'skipped_no_external_url';
    else {
      const companyRoleKey = `${item.company.toLowerCase()}::${item.title.toLowerCase()}`;
      status = helpers.seenUrls.has(normalizedUrl) || helpers.seenCompanyRoles.has(companyRoleKey)
        ? 'skipped_dup'
        : 'added';

      if (status === 'added') {
        helpers.seenUrls.add(normalizedUrl);
        helpers.seenCompanyRoles.add(companyRoleKey);
        newOffers.push({ company: item.company, title: item.title, url: normalizedUrl });
      }
    }

    results.push({
      ...item,
      normalizedUrl,
      status,
      cleanupAction: buildCleanupAction(status),
    });
    if (historyUrl) {
      historyRows.push({
        url: historyUrl,
        source: 'Welcome to the Jungle',
        title: item.title || '(missing title)',
        company: item.company || '(missing company)',
        status,
      });
    }
  }

  return { results, newOffers, historyRows };
}

function buildOutput(date, results) {
  const summary = {
    received: results.length,
    added: 0,
    skipped_dup: 0,
    skipped_non_fit: 0,
    skipped_no_external_url: 0,
    skipped_invalid: 0,
  };
  for (const result of results) summary[result.status] += 1;
  return { date, results, summary };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = readInput(args);
  if (!input) {
    throw new Error('Provide --input <file> or --stdin. Use Career-Ops scan-wttj mode to extract jobs from the logged-in Codex Chrome extension tab.');
  }
  const items = Array.isArray(input.items) ? input.items : [];
  const portals = loadPortalsConfig();
  const helpers = {
    portals,
    titleFilter: buildTitleFilter(portals?.title_filter),
    icExceptionFilter: buildIcExceptionFilter(portals?.title_filter),
    excludedCompanyFilter: buildExcludedCompanyFilter(portals?.title_filter),
    seenUrls: loadSeenUrls(),
    seenCompanyRoles: loadSeenCompanyRoles(),
  };
  const { results, newOffers, historyRows } = processItems(items.slice(0, args.limit), helpers);
  const date = new Date().toISOString().slice(0, 10);

  if (!args.dryRun) {
    appendToPipeline(newOffers);
    appendHistoryRows(historyRows, date);
  }
  process.stdout.write(`${JSON.stringify(buildOutput(date, results), null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
