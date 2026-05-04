import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export const SCAN_HISTORY_PATH = 'data/scan-history.tsv';
export const PIPELINE_PATH = 'data/pipeline.md';
export const APPLICATIONS_PATH = 'data/applications.md';

mkdirSync('data', { recursive: true });

export function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function buildTitleFilter(titleFilter) {
  const positive = (titleFilter?.positive || []).map((keyword) => keyword.toLowerCase());
  const negative = (titleFilter?.negative || []).map((keyword) => keyword.toLowerCase());

  return (title) => {
    const lower = title.toLowerCase();
    const hasPositive = positive.length === 0 || positive.some((keyword) => lower.includes(keyword));
    const hasNegative = negative.some((keyword) => lower.includes(keyword));
    return hasPositive && !hasNegative;
  };
}

export function buildIcExceptionFilter(titleFilter) {
  const negative = (titleFilter?.negative || []).map((keyword) => keyword.toLowerCase());
  const fallbackTitles = [
    'senior engineer',
    'senior software engineer',
    'senior backend engineer',
    'staff engineer',
    'staff software engineer',
    'staff backend engineer',
    'principal engineer',
    'principal software engineer',
    'principal backend engineer',
  ];

  return (title, company = {}) => {
    const lower = title.toLowerCase();
    const hasNegative = negative.some((keyword) => lower.includes(keyword));
    if (hasNegative) return false;

    const customAllow = (company.ic_exception_titles || []).map((keyword) => keyword.toLowerCase());
    const allowList = customAllow.length > 0 ? customAllow : fallbackTitles;
    return allowList.some((keyword) => lower.includes(keyword));
  };
}

export function hasIcExceptionPolicy(company = {}) {
  return company.ic_exception_company === true || company.culture_fit_tier === 'high';
}

export function loadSeenUrls() {
  const seen = new Set();

  if (existsSync(SCAN_HISTORY_PATH)) {
    const lines = readFileSync(SCAN_HISTORY_PATH, 'utf-8').split('\n');
    for (const line of lines.slice(1)) {
      const url = line.split('\t')[0];
      if (url) seen.add(url);
    }
  }

  if (existsSync(PIPELINE_PATH)) {
    const text = readFileSync(PIPELINE_PATH, 'utf-8');
    for (const match of text.matchAll(/- \[[ x!]\] (https?:\/\/\S+)/g)) {
      seen.add(match[1]);
    }
  }

  if (existsSync(APPLICATIONS_PATH)) {
    const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
    for (const match of text.matchAll(/https?:\/\/[^\s|)]+/g)) {
      seen.add(match[0]);
    }
  }

  return seen;
}

export function loadSeenCompanyRoles() {
  const seen = new Set();
  if (!existsSync(APPLICATIONS_PATH)) return seen;

  const text = readFileSync(APPLICATIONS_PATH, 'utf-8');
  for (const match of text.matchAll(/\|[^|]+\|[^|]+\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g)) {
    const company = match[1].trim().toLowerCase();
    const role = match[2].trim().toLowerCase();
    if (company && role && company !== 'company') {
      seen.add(`${company}::${role}`);
    }
  }

  return seen;
}

export function appendToPipeline(offers) {
  if (offers.length === 0) return;

  let text = readFileSync(PIPELINE_PATH, 'utf-8');
  const marker = '## Pendientes';
  const idx = text.indexOf(marker);

  if (idx === -1) {
    const procIdx = text.indexOf('## Procesadas');
    const insertAt = procIdx === -1 ? text.length : procIdx;
    const block = `\n${marker}\n\n${offers.map((offer) => `- [ ] ${offer.url} | ${offer.company} | ${offer.title}`).join('\n')}\n\n`;
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  } else {
    const afterMarker = idx + marker.length;
    const nextSection = text.indexOf('\n## ', afterMarker);
    const insertAt = nextSection === -1 ? text.length : nextSection;
    const block = `\n${offers.map((offer) => `- [ ] ${offer.url} | ${offer.company} | ${offer.title}`).join('\n')}\n`;
    text = text.slice(0, insertAt) + block + text.slice(insertAt);
  }

  writeFileSync(PIPELINE_PATH, text, 'utf-8');
}

export function appendHistoryRows(rows, date) {
  if (rows.length === 0) return;

  if (!existsSync(SCAN_HISTORY_PATH)) {
    writeFileSync(SCAN_HISTORY_PATH, 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n', 'utf-8');
  }

  const lines = rows
    .map((row) => `${row.url}\t${date}\t${row.source}\t${row.title}\t${row.company}\t${row.status}`)
    .join('\n') + '\n';

  appendFileSync(SCAN_HISTORY_PATH, lines, 'utf-8');
}

export function normalizeExternalJobUrl(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'jobs.lever.co') {
      parsed.pathname = parsed.pathname.replace(/\/apply$/, '');
      parsed.search = '';
      return parsed.toString();
    }

    if (parsed.hostname === 'jobs.ashbyhq.com') {
      parsed.pathname = parsed.pathname.replace(/\/application$/, '');
      parsed.search = '';
      return parsed.toString();
    }

    if (parsed.hostname.includes('greenhouse.io') && parsed.pathname === '/embed/job_app') {
      const board = parsed.searchParams.get('for');
      const token = parsed.searchParams.get('token');
      if (board && token) {
        parsed.pathname = `/jobs/${token}`;
        parsed.search = '';
        parsed.hostname = parsed.hostname.includes('eu.greenhouse.io')
          ? `job-boards.eu.greenhouse.io`
          : 'job-boards.greenhouse.io';
        return `https://${parsed.hostname}/${board}${parsed.pathname}`;
      }
    }

    if (parsed.hostname === 'apply.workable.com') {
      parsed.search = '';
      return parsed.toString();
    }

    if (parsed.hostname.includes('successfactors.com')) {
      const next = new URL(`${parsed.origin}${parsed.pathname}`);
      for (const key of ['career_ns', 'company', 'career_job_req_id']) {
        const value = parsed.searchParams.get(key);
        if (value) next.searchParams.set(key, value);
      }
      return next.toString();
    }

    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('utm_content');
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isObviousJobgetherNonFit(title, company, titleFilter, icExceptionFilter, portals) {
  if (!title) return true;

  const matchingCompany = (portals?.tracked_companies || []).find((entry) => entry.name?.toLowerCase() === (company || '').toLowerCase());
  if (titleFilter(title)) return false;
  if (matchingCompany && hasIcExceptionPolicy(matchingCompany) && icExceptionFilter(title, matchingCompany)) return false;
  return true;
}
