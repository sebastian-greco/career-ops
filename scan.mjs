#!/usr/bin/env node

/**
 * scan.mjs — Zero-token portal scanner
 *
 * Fetches Greenhouse, Ashby, and Lever APIs directly, applies title
 * filters from portals.yml, deduplicates against existing history,
 * and appends new offers to pipeline.md + scan-history.tsv.
 *
 * Zero Claude API tokens — pure HTTP + JSON.
 *
 * Usage:
 *   node scan.mjs                  # scan all enabled companies
 *   node scan.mjs --dry-run        # preview without writing files
 *   node scan.mjs --company Cohere # scan a single company
 */

import { readFileSync, existsSync } from 'fs';
import { chromium } from 'playwright';
import yaml from 'js-yaml';
import { classifyLiveness } from './liveness-core.mjs';
import {
  APPLICATIONS_PATH,
  PIPELINE_PATH,
  SCAN_HISTORY_PATH,
  appendHistoryRows,
  appendToPipeline,
  buildIcExceptionFilter,
  buildTitleFilter,
  hasIcExceptionPolicy,
  loadSeenCompanyRoles,
  loadSeenUrls,
  normalizeText,
} from './scan-utils.mjs';
const parseYaml = yaml.load;

// ── Config ──────────────────────────────────────────────────────────

const PORTALS_PATH = 'portals.yml';
const CONCURRENCY = 10;
const FETCH_TIMEOUT_MS = 10_000;
const BROWSER_TIMEOUT_MS = 20_000;
const BROWSER_WAIT_MS = 1_500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toAbsoluteUrl(base, value) {
  try {
    return new URL(value, base).toString();
  } catch {
    return value || '';
  }
}

// ── API detection ───────────────────────────────────────────────────

function detectApi(company) {
  if (company.api && company.api_provider) {
    return { type: company.api_provider, url: company.api };
  }

  // Greenhouse: explicit api field
  if (company.api && company.api.includes('greenhouse')) {
    return { type: 'greenhouse', url: company.api };
  }

  if (company.api && company.api.includes('api.lever.co')) {
    return { type: 'lever', url: company.api };
  }

  if (company.api && company.api.includes('.bamboohr.com/careers/list')) {
    return { type: 'bamboohr', url: company.api };
  }

   if (company.api && company.api.includes('.jobs.personio.de/xml')) {
    return { type: 'personio', url: company.api };
  }

  const url = company.careers_url || '';

  // Ashby
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  if (ashbyMatch) {
    return {
      type: 'ashby',
      url: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true`,
    };
  }

  // Lever
  const leverMatch = url.match(/jobs\.lever\.co\/([^/?#]+)/);
  if (leverMatch) {
    return {
      type: 'lever',
      url: `https://api.lever.co/v0/postings/${leverMatch[1]}`,
    };
  }

  // Greenhouse EU boards
  const ghEuMatch = url.match(/job-boards(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/);
  if (ghEuMatch && !company.api) {
    return {
      type: 'greenhouse',
      url: `https://boards-api.greenhouse.io/v1/boards/${ghEuMatch[1]}/jobs`,
    };
  }

  // BambooHR
  const bambooMatch = url.match(/https?:\/\/([^/.]+)\.bamboohr\.com\/careers(?:\/list)?/);
  if (bambooMatch) {
    return {
      type: 'bamboohr',
      url: `https://${bambooMatch[1]}.bamboohr.com/careers/list`,
    };
  }

  const personioMatch = url.match(/https?:\/\/([^/]+)\.jobs\.personio\.de\/?/);
  if (personioMatch) {
    return {
      type: 'personio',
      url: `https://${personioMatch[1]}.jobs.personio.de/xml`,
    };
  }

  return null;
}

// ── API parsers ─────────────────────────────────────────────────────

function parseGreenhouse(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.absolute_url || '',
    company: companyName,
    location: j.location?.name || '',
  }));
}

function parseAshby(json, companyName) {
  const jobs = json.jobs || [];
  return jobs.map(j => ({
    title: j.title || '',
    url: j.jobUrl || '',
    company: companyName,
    location: j.location || '',
  }));
}

function parseLever(json, companyName) {
  if (!Array.isArray(json)) return [];
  return json.map(j => ({
    title: j.text || '',
    url: j.hostedUrl || '',
    company: companyName,
    location: j.categories?.location || '',
  }));
}

function parseBambooHr(json, companyName, company) {
  const jobs = Array.isArray(json?.result) ? json.result : Array.isArray(json) ? json : [];
  const base = (() => {
    const sourceUrl = company.api || company.careers_url || '';
    const match = sourceUrl.match(/https?:\/\/([^/]+\.bamboohr\.com)/);
    return match ? `https://${match[1]}` : '';
  })();

  const normalizeLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.name || location.city || location.value || '';
    }
    return '';
  };

  return jobs
    .map(j => ({
      title: j.jobOpeningName || j.jobOpening?.jobOpeningName || '',
      url: j.jobOpeningShareUrl || (j.id && base ? `${base}/careers/${j.id}/detail` : company.careers_url || ''),
      company: companyName,
      location: normalizeLocation(j.location),
    }))
    .filter(j => j.title && j.url);
}

function parsePersonio(xml, companyName, company) {
  const jobs = [];
  const positions = xml.match(/<position>([\s\S]*?)<\/position>/g) || [];

  const readTag = (block, tag) => {
    const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return normalizeText(decodeHtmlEntities(match?.[1] || ''));
  };

  for (const block of positions) {
    const id = readTag(block, 'id');
    const title = readTag(block, 'name');
    const location = readTag(block, 'office');
    const url = id ? `${company.careers_url.replace(/\/$/, '')}/job/${id}` : company.careers_url || '';
    if (!title || !url) continue;
    jobs.push({ title, url, company: companyName, location });
  }

  return jobs;
}

const PARSERS = { greenhouse: parseGreenhouse, ashby: parseAshby, lever: parseLever, bamboohr: parseBambooHr, personio: parsePersonio };

// ── Fetch with timeout ──────────────────────────────────────────────

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithRetry(url) {
  try {
    return await fetchJson(url);
  } catch (error) {
    if (error.name !== 'AbortError') throw error;
    await sleep(300);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS * 2);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

async function fetchApiPayload(url, type) {
  if (type === 'personio') {
    return await fetchText(url);
  }

  return await fetchJsonWithRetry(url);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS * 2);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtmlEntities(value) {
  return (value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

function stripTags(value) {
  return normalizeText(decodeHtmlEntities((value || '').replace(/<[^>]+>/g, ' ')));
}

function decodeSearchHref(value) {
  if (!value) return '';

  const decoded = decodeHtmlEntities(value);

  try {
    const candidate = new URL(decoded, 'https://html.duckduckgo.com');
    const redirect = candidate.searchParams.get('uddg');
    if (redirect) return decodeURIComponent(redirect);
    return candidate.toString();
  } catch {
    return decoded;
  }
}

function inferCompanyFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host.includes('jobs.ashbyhq.com')) return parsed.pathname.split('/').filter(Boolean)[0] || host;
    if (host.includes('jobs.lever.co')) return parsed.pathname.split('/').filter(Boolean)[0] || host;
    if (host.includes('greenhouse.io')) return parsed.pathname.split('/').filter(Boolean)[0] || host;
    if (host.includes('workable.com')) return parsed.pathname.split('/').filter(Boolean)[0] || host;
    if (host.includes('bamboohr.com')) return host.split('.')[0] || host;

    return host.split('.')[0] || host;
  } catch {
    return '';
  }
}

function extractSearchTitleAndCompany(rawTitle, url) {
  const cleaned = normalizeText(rawTitle);
  const match = cleaned.match(/(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$/i);

  if (match) {
    return {
      title: normalizeText(match[1]),
      company: normalizeText(match[2]),
    };
  }

  return {
    title: cleaned,
    company: normalizeText(inferCompanyFromUrl(url)),
  };
}

async function runSearchQuery(queryConfig) {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(queryConfig.query)}`;
  const html = await fetchText(searchUrl);
  const matches = html.matchAll(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
  const results = [];

  for (const match of matches) {
    const url = decodeSearchHref(match[1]);
    const rawTitle = stripTags(match[2]);
    if (!url || !rawTitle) continue;

    const { title, company } = extractSearchTitleAndCompany(rawTitle, url);
    results.push({
      title,
      url,
      company: company || 'Unknown',
      location: '',
    });
  }

  return results;
}

function buildCompanySearchConfig(company) {
  return {
    name: company.name,
    query: company.scan_query,
  };
}

function resolveApi(company) {
  return detectApi(company);
}

function pickBrowserExtractor(url) {
  const lower = url.toLowerCase();

  if (lower.includes('make.com')) return extractMakeJobs;
  if (lower.includes('tinybird.co')) return extractTinybirdJobs;
  if (lower.includes('clarity.ai')) return extractClarityJobs;
  if (lower.includes('doist.com')) return extractDoistJobs;
  if (lower.includes('forto.com')) return extractFortoJobs;
  if (lower.includes('workable.com')) return extractWorkableJobs;
  if (lower.includes('coda.io')) return extractCodaJobs;
  if (lower.includes('vinted.com')) return extractVintedJobs;
  if (lower.includes('coreweave.com')) return extractCoreWeaveJobs;
  if (lower.includes('ghost.org')) return extractGhostJobs;
  if (lower.includes('consensys.io')) return extractConsensysJobs;

  return extractGenericJobs;
}

async function clickLoadMore(page) {
  for (let i = 0; i < 10; i++) {
    const button = page.getByRole('button', { name: /load more|show more|more jobs/i }).first();
    if (!await button.isVisible().catch(() => false)) break;
    await button.click({ timeout: 2_000 }).catch(() => null);
    await page.waitForTimeout(500);
  }
}

async function evaluateAnchorJobs(frame, selector, options = {}) {
  return frame.evaluate(({ selector, options }) => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

    const getLines = (element) => normalize(element?.innerText || '')
      .split(/\n+/)
      .map(normalize)
      .filter(Boolean);

    return Array.from(document.querySelectorAll(selector)).map((anchor) => {
      const container = options.closest ? anchor.closest(options.closest) : anchor.parentElement;
      const lines = getLines(container || anchor);
      const banned = new Set(options.banned || []);
      const title = normalize(
        typeof options.titleIndex === 'number'
          ? lines[options.titleIndex] || ''
          : options.useAnchorText === false
            ? (lines.find((line) => !banned.has(line)) || '')
            : anchor.innerText || lines.find((line) => !banned.has(line)) || ''
      );

      const location = normalize(
        typeof options.locationIndex === 'number'
          ? lines[options.locationIndex] || ''
          : ''
      );

      return {
        title,
        url: anchor.href,
        location,
      };
    });
  }, { selector, options });
}

async function extractMakeJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="/careers-detail?gh_jid="]');
}

async function extractTinybirdJobs(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

    return Array.from(document.querySelectorAll('a[href*="/job-offers/"]')).map((anchor) => {
      const container = anchor.closest('section, div');
      const lines = normalize(container?.innerText || anchor.innerText || '')
        .split(/\n+/)
        .map(normalize)
        .filter(Boolean)
        .filter((line) => line !== '[see the offer]');

      return {
        title: normalize(anchor.innerText) || lines[0] || '',
        url: anchor.href,
        location: lines[1] || '',
      };
    });
  });
}

async function extractClarityJobs(page) {
  const frame = page.frames().find((item) => item.url().includes('greenhouse.io'));
  if (!frame) return [];
  return evaluateAnchorJobs(frame, 'a[href*="/clarityai/jobs/"]');
}

async function extractDoistJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="/careers/"]', {
    closest: 'a',
  });
}

async function extractFortoJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="/forto-jobs/"]', {
    closest: 'main',
    useAnchorText: false,
    banned: ['View Job', 'POSITION', 'DEPARTMENT', 'EMPLOYMENT TYPE', 'LOCATION'],
  });
}

async function extractWorkableJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="/job/"]');
}

async function extractCodaJobs() {
  return [];
}

async function extractVintedJobs(page) {
  await clickLoadMore(page);
  return evaluateAnchorJobs(page, 'a[href*="/jobs/j/"]');
}

async function extractCoreWeaveJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="gh_jid="]');
}

async function extractGhostJobs(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

    return Array.from(document.querySelectorAll('a[href*="careers.ghost.org/"][href$="/en"]')).map((anchor) => {
      const lines = (anchor.innerText || '')
        .split(/\n+/)
        .map(normalize)
        .filter(Boolean);

      return {
        title: lines[0] || '',
        url: anchor.href,
        location: lines.slice(1).join(' '),
      };
    });
  });
}

async function extractConsensysJobs(page) {
  return evaluateAnchorJobs(page, 'a[href*="/open-roles/"]');
}

async function extractGenericJobs(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const candidates = [];

    for (const anchor of document.querySelectorAll('a[href]')) {
      const href = anchor.href || '';
      if (!href || href === window.location.href) continue;

      const title = normalize(anchor.innerText);
      if (!title || title.length > 180) continue;
      if (/privacy|cookie|learn more|contact|login|apply now/i.test(title)) continue;

      candidates.push({ title, url: href, location: '' });
    }

    return candidates;
  });
}

function normalizeBrowserJobs(jobs, companyName, baseUrl) {
  return jobs
    .map((job) => ({
      title: normalizeText(job.title),
      url: toAbsoluteUrl(baseUrl, job.url),
      company: companyName,
      location: normalizeText(job.location),
    }))
    .filter((job) => job.title && job.url)
    .filter((job) => !/privacy|cookie|job applicant privacy policy/i.test(job.title));
}

function processJobs(jobs, company, source, state) {
  state.totalFound += jobs.length;

  for (const rawJob of jobs) {
    const job = {
      ...rawJob,
      title: normalizeText(rawJob.title),
      url: normalizeText(rawJob.url),
      location: normalizeText(rawJob.location),
      company: rawJob.company || company.name,
    };

    const passesDefaultFilter = state.titleFilter(job.title);
    const passesCompanyIcException = hasIcExceptionPolicy(company) && state.icExceptionFilter(job.title, company);

    if (!passesDefaultFilter && !passesCompanyIcException) {
      state.totalFiltered++;
      state.historyRows.push({ ...job, source, status: 'skipped_title' });
      continue;
    }

    if (state.seenUrls.has(job.url)) {
      state.totalDupes++;
      state.historyRows.push({ ...job, source, status: 'skipped_dup' });
      continue;
    }

    const key = `${job.company.toLowerCase()}::${job.title.toLowerCase()}`;
    if (state.seenCompanyRoles.has(key)) {
      state.totalDupes++;
      state.historyRows.push({ ...job, source, status: 'skipped_dup' });
      continue;
    }

    state.seenUrls.add(job.url);
    state.seenCompanyRoles.add(key);
    const offer = { ...job, source };
    if (source.startsWith('WebSearch')) {
      state.pendingSearchOffers.push(offer);
      continue;
    }

    state.newOffers.push(offer);
    state.historyRows.push({ ...offer, status: 'added' });
  }
}

async function verifySearchOffersLiveness(state) {
  if (state.pendingSearchOffers.length === 0) return;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });

  try {
    for (const offer of state.pendingSearchOffers) {
      try {
        const response = await page.goto(offer.url, { waitUntil: 'domcontentloaded', timeout: BROWSER_TIMEOUT_MS });
        await page.waitForTimeout(BROWSER_WAIT_MS + 500);

        const status = response?.status() ?? 0;
        const finalUrl = page.url();
        const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
        const applyControls = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]'))
            .filter((element) => {
              if (element.closest('nav, header, footer')) return false;
              if (element.closest('[aria-hidden="true"]')) return false;

              const style = window.getComputedStyle(element);
              if (style.display === 'none' || style.visibility === 'hidden') return false;
              if (!element.getClientRects().length) return false;
              return true;
            })
            .map((element) => [
              element.innerText,
              element.value,
              element.getAttribute('aria-label'),
              element.getAttribute('title'),
            ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        });

        const verdict = classifyLiveness({ status, finalUrl, bodyText, applyControls });
        if (verdict.result === 'active') {
          state.newOffers.push(offer);
          state.historyRows.push({ ...offer, status: 'added' });
        } else {
          state.totalExpired++;
          state.historyRows.push({ ...offer, status: 'skipped_expired' });
        }
      } catch (error) {
        state.totalExpired++;
        state.historyRows.push({ ...offer, status: 'skipped_expired' });
        state.errors.push({ company: offer.company, error: `liveness check failed for ${offer.url}: ${error.message}` });
      }
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

async function scanBrowserCompanies(companies, state) {
  if (companies.length === 0) return;

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    for (const company of companies) {
      if (!company.careers_url) continue;

      try {
        const response = await page.goto(company.careers_url, {
          waitUntil: 'domcontentloaded',
          timeout: BROWSER_TIMEOUT_MS,
        });

        if (response && response.status() >= 400) {
          throw new Error(`HTTP ${response.status()}`);
        }

        await page.waitForTimeout(BROWSER_WAIT_MS);
        const extractor = pickBrowserExtractor(page.url());
        const jobs = normalizeBrowserJobs(await extractor(page), company.name, page.url());
        processJobs(jobs, company, `${company.name} careers_url`, state);
      } catch (error) {
        state.errors.push({ company: company.name, error: error.message });
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

// ── Parallel fetch with concurrency limit ───────────────────────────

async function parallelFetch(tasks, limit) {
  const results = [];
  let i = 0;

  async function next() {
    while (i < tasks.length) {
      const task = tasks[i++];
      results.push(await task());
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => next());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const companyFlag = args.indexOf('--company');
  const filterCompany = companyFlag !== -1 ? args[companyFlag + 1]?.toLowerCase() : null;

  // 1. Read portals.yml
  if (!existsSync(PORTALS_PATH)) {
    console.error('Error: portals.yml not found. Run onboarding first.');
    process.exit(1);
  }

  const config = parseYaml(readFileSync(PORTALS_PATH, 'utf-8'));
  const companies = config.tracked_companies || [];
  const searchQueries = (config.search_queries || []).filter(q => q.enabled !== false);
  const titleFilter = buildTitleFilter(config.title_filter);
  const icExceptionFilter = buildIcExceptionFilter(config.title_filter);

  // 2. Split enabled companies into API-backed, browser-backed, and company-search paths
  const enabledCompanies = companies
    .filter(c => c.enabled !== false)
    .filter(c => !filterCompany || c.name.toLowerCase().includes(filterCompany))
    .map(c => ({ ...c, _api: resolveApi(c) }));
  const companySearchTargets = enabledCompanies.filter(c => c.scan_method === 'websearch' && c.scan_query);
  const apiTargets = enabledCompanies.filter(c => c._api !== null && c.scan_method !== 'websearch');
  const browserTargets = enabledCompanies.filter(c => c._api === null && c.careers_url && c.scan_method !== 'websearch');

  console.log(`Scanning ${enabledCompanies.length} companies (${apiTargets.length} API, ${browserTargets.length} browser, ${companySearchTargets.length} company-search)`);
  if (dryRun) console.log('(dry run — no files will be written)\n');

  // 3. Load dedup sets
  const seenUrls = loadSeenUrls();
  const seenCompanyRoles = loadSeenCompanyRoles();

  // 4. Fetch all APIs
  const date = new Date().toISOString().slice(0, 10);
  const state = {
    titleFilter,
    icExceptionFilter,
    seenUrls,
    seenCompanyRoles,
    totalFound: 0,
    totalFiltered: 0,
    totalDupes: 0,
    totalExpired: 0,
    newOffers: [],
    pendingSearchOffers: [],
    historyRows: [],
    errors: [],
  };
  const browserFallbackTargets = [];
  const companySearchFallbackTargets = [];

  const tasks = apiTargets.map(company => async () => {
    const { type, url } = company._api;
    try {
      const payload = await fetchApiPayload(url, type);
      const jobs = PARSERS[type](payload, company.name, company);
      processJobs(jobs, company, `${type}-api`, state);
    } catch (err) {
      if (company.scan_query) companySearchFallbackTargets.push(company);
      else if (company.careers_url) browserFallbackTargets.push(company);
      else state.errors.push({ company: company.name, error: err.message });
    }
  });

  await parallelFetch(tasks, CONCURRENCY);
  await scanBrowserCompanies([...browserTargets, ...browserFallbackTargets], state);

  const companySearchTasks = [...companySearchTargets, ...companySearchFallbackTargets].map(company => async () => {
    try {
      const jobs = await runSearchQuery(buildCompanySearchConfig(company));
      processJobs(jobs, company, `CompanySearch — ${company.name}`, state);
    } catch (error) {
      state.errors.push({ company: company.name, error: error.message });
    }
  });

  await parallelFetch(companySearchTasks, Math.min(CONCURRENCY, 4));

  const searchTasks = searchQueries.map(queryConfig => async () => {
    try {
      const jobs = await runSearchQuery(queryConfig);
      processJobs(jobs, { name: 'WebSearch' }, `WebSearch — ${queryConfig.name}`, state);
    } catch (error) {
      state.errors.push({ company: queryConfig.name, error: error.message });
    }
  });

  await parallelFetch(searchTasks, Math.min(CONCURRENCY, 4));
  await verifySearchOffersLiveness(state);

  // 5. Write results
  if (!dryRun && state.newOffers.length > 0) {
    appendToPipeline(state.newOffers);
  }

  if (!dryRun && state.historyRows.length > 0) {
    appendHistoryRows(state.historyRows, date);
  }

  // 6. Print summary
  console.log(`\n${'━'.repeat(45)}`);
  console.log(`Portal Scan — ${date}`);
  console.log(`${'━'.repeat(45)}`);
  console.log(`Companies scanned:     ${enabledCompanies.length}`);
  console.log(`Total jobs found:      ${state.totalFound}`);
  console.log(`Filtered by title:     ${state.totalFiltered} removed`);
  console.log(`Duplicates:            ${state.totalDupes} skipped`);
  console.log(`Expired:               ${state.totalExpired} skipped`);
  console.log(`New offers added:      ${state.newOffers.length}`);

  if (state.errors.length > 0) {
    console.log(`\nErrors (${state.errors.length}):`);
    for (const e of state.errors) {
      console.log(`  ✗ ${e.company}: ${e.error}`);
    }
  }

  if (state.newOffers.length > 0) {
    console.log('\nNew offers:');
    for (const o of state.newOffers) {
      console.log(`  + ${o.company} | ${o.title} | ${o.location || 'N/A'}`);
    }
    if (dryRun) {
      console.log('\n(dry run — run without --dry-run to save results)');
    } else {
      console.log(`\nResults saved to ${PIPELINE_PATH} and ${SCAN_HISTORY_PATH}`);
    }
  }

  console.log(`\n→ Run /career-ops pipeline to evaluate new offers.`);
  console.log('→ Share results and get help: https://discord.gg/8pRpHETxa4');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
