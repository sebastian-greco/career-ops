// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// Deel provider - scrapes the structured job payload embedded in Deel's own
// careers platform (www.deel.com/careers, rendered by jobs.deel.com).
//
// Why a scraper instead of an ATS API: Deel still runs its postings on Ashby
// internally (every job carries an ashby_id / ashby_jid), but their board is
// unlisted - the posting-api for org "deel" returns 200 with an empty jobs
// array, while direct posting URLs stay live. The only complete public
// source is the careers page itself, which embeds the full job list as a
// Next.js flight payload: a components array whose career-job-listing
// component carries a jobs[] of attribute objects (title, department,
// all_locations, compensation summary, posted date, external_link).
// Extracting that payload is zero-token and needs no per-job requests.

const ALLOWED_DEEL_HOSTS = new Set(['www.deel.com', 'deel.com']);
const JOB_BOARD_HOST = 'jobs.deel.com';

/** @param {string} url */
function assertDeelUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('deel: invalid URL: ' + url);
  }
  if (parsed.protocol !== 'https:') throw new Error('deel: URL must use HTTPS: ' + url);
  if (!ALLOWED_DEEL_HOSTS.has(parsed.hostname)) {
    throw new Error('deel: untrusted hostname "' + parsed.hostname + '" - must be one of: ' + [...ALLOWED_DEEL_HOSTS].join(', '));
  }
  return url;
}

// careers_url like https://www.deel.com/careers/ (locale-prefixed variants
// such as /zh-cn/careers/ also resolve to the same English payload source).
/** @param {import('./_types.js').PortalEntry} entry */
function isCareersUrl(entry) {
  const raw = entry.careers_url || '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  return ALLOWED_DEEL_HOSTS.has(parsed.hostname) && parsed.pathname.toLowerCase().includes('/careers');
}

// Next.js streams the page in self.__next_f.push([...]) chunks whose string
// elements are the flight payload split at arbitrary boundaries. Decode every
// chunk and concatenate the strings so the payload becomes one plain-text
// buffer - job objects can span chunk boundaries.
/** @param {string} html */
export function decodeFlightChunks(html) {
  let flight = '';
  const re = /self\.__next_f\.push\((\[.*?\])\)/gs;
  let m;
  while ((m = re.exec(html))) {
    try {
      const arr = JSON.parse(m[1]);
      for (const item of arr) {
        if (typeof item === 'string') flight += item;
      }
    } catch {
      // A non-flight script or a truncated chunk - skip without failing the scan.
    }
  }
  return flight;
}

// Balance-match a complete JSON object starting at a known '{' index.
// Returns the parsed object, or null when the span never closes.
/** @param {string} text */
/** @param {number} start */
export function extractObjectAt(text, start) {
  if (text[start] !== '{') return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Each embedded job is {"id":<n>,"attributes":{"ashby_id":...}}. The nearest
// '{' before "ashby_id" is always the attributes-object opener, so a backward
// scan + forward balance-match is robust against changes in the surrounding
// component structure.
/** @param {string} flight */
export function extractJobAttributes(flight) {
  /** @type {any[]} */
  const out = [];
  const seen = new Set();
  const re = /"ashby_id":"[0-9a-f-]{36}"/g;
  let m;
  while ((m = re.exec(flight))) {
    let start = m.index;
    while (start > 0 && flight[start - 1] !== '{') start--;
    if (start === 0) continue;
    // The backward walk stops right after the opener, so the object starts
    // at start - 1 and flight[start] is its first interior character.
    const obj = extractObjectAt(flight, start - 1);
    if (obj && typeof obj === 'object') {
      const attrs = obj.attributes && typeof obj.attributes === 'object' ? obj.attributes : obj;
      const key = String(attrs.external_link || attrs.ashby_id || '');
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(attrs);
      }
    }
  }
  return out;
}

// Deel ships a display summary like "$$54,000 - $140,000 USD". Parse it into
// the scanner's {min,max,currency} salary shape; anything unparseable stays
// absent so scan.mjs's salary filter passes conservatively.
/** @param {unknown} raw */
export function parseCompensationSummary(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const nums = [...raw.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g)]
    .map((m) => Number(m[0].replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;
  const currency = (raw.match(/\b([A-Z]{3})\b/) || [])[1] || '';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  /** @type {{min: number, max: number, currency?: string}} */
  const salary = { min, max };
  if (currency) salary.currency = currency;
  return salary;
}

// NaN-safe Date.parse - mirrors the ashby provider helper so a malformed
// posted date is omitted rather than coerced.
/** @param {unknown} value */
function toEpochMs(value) {
  if (!value) return undefined;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** @param {import('./_types.js').PortalEntry} entry */
function assertEntryUrl(entry) {
  const url = String(entry.careers_url || '');
  if (!url) throw new Error('deel: entry has no careers_url');
  return assertDeelUrl(url);
}

export default {
  id: 'deel',

  detect(entry) {
    if (!isCareersUrl(entry)) return null;
    return { url: entry.careers_url };
  },

  async fetch(entry, ctx) {
    const careersUrl = assertEntryUrl(entry);
    const html = await ctx.fetchText(careersUrl, { redirect: 'error' });
    const flight = decodeFlightChunks(html);
    const attrs = extractJobAttributes(flight);
    if (attrs.length === 0) {
      throw new Error('deel: no embedded jobs found on ' + careersUrl + ' - careers page structure may have changed');
    }

    return attrs
      .filter((a) => a.is_listed !== false)
      .map((a) => {
        const locations = Array.isArray(a.all_locations)
          ? a.all_locations.filter((/** @type {unknown} */ l) => typeof l === 'string' && l.trim())
          : [];
        const job = {
          title: String(a.title || '').trim(),
          url: String(a.external_link || '').trim(),
          company: entry.name,
          location: locations.join(', '),
        };
        if (!job.title || !/^https:\//.test(job.url)) return null;
        // Only emit URLs that actually point at Deel's job board (the dedup key).
        try {
          if (new URL(job.url).hostname !== JOB_BOARD_HOST) return null;
        } catch {
          return null;
        }
        const postedAt = toEpochMs(a.ashby_published_date);
        if (postedAt) job.postedAt = postedAt;
        const salary = parseCompensationSummary(a.compensation_tier_summary);
        if (salary) job.salary = salary;
        const description = typeof a.full_job_description === 'string' ? a.full_job_description.trim() : '';
        if (description) job.description = description;
        return job;
      })
      .filter(Boolean);
  },
};
