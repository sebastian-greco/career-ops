// tests/providers/deel.test.mjs — provider-contract tests for the Deel
// careers-page provider. Covers id/detect/fetch plus the exported payload
// helpers: flight-chunk decoding, brace-matched attribute extraction, and
// compensation-summary parsing. Deel's board is unlisted on Ashby's public
// posting-api even though postings carry ashby_ids, so the provider scrapes
// the embedded Next.js flight payload on www.deel.com/careers — these tests
// pin that extraction contract against a synthetic page.
import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — deel');

try {
  const deelModule = await import(pathToFileURL(join(ROOT, 'providers/deel.mjs')).href);
  const deel = deelModule.default;
  const { decodeFlightChunks, extractObjectAt, extractJobAttributes, parseCompensationSummary } = deelModule;

  if (deel.id === 'deel') pass('deel.id is "deel"');
  else fail(`deel.id is ${JSON.stringify(deel.id)}`);

  // detect() — positive / negative cases.
  const hit = deel.detect({ name: 'Deel', careers_url: 'https://www.deel.com/careers/' });
  if (hit && hit.url === 'https://www.deel.com/careers/') {
    pass('deel.detect() claims a www.deel.com/careers entry');
  } else {
    fail(`deel.detect() returned ${JSON.stringify(hit)}`);
  }

  const localeHit = deel.detect({ name: 'Deel', careers_url: 'https://www.deel.com/zh-cn/careers/' });
  if (localeHit) pass('deel.detect() claims locale-prefixed careers pages');
  else fail('deel.detect() should claim locale-prefixed careers pages');

  if (deel.detect({ name: 'X', careers_url: 'https://jobs.deel.com/job-boards/klarna' }) === null) {
    pass('deel.detect() ignores jobs.deel.com board paths (host allowlist)');
  } else {
    fail('deel.detect() must not claim jobs.deel.com board paths');
  }

  if (deel.detect({ name: 'X', careers_url: 'https://evil.example/careers' }) === null
      && deel.detect({ name: 'X' }) === null
      && deel.detect({ name: 'X', careers_url: null }) === null) {
    pass('deel.detect() returns null for untrusted hosts and missing URLs');
  } else {
    fail('deel.detect() should return null for untrusted/missing URLs');
  }

  // extractObjectAt — balanced extraction, including strings with braces and
  // escaped quotes; malformed/truncated spans return null.
  const nested = '{"a":1,"b":{"c":"} nope \\" x"}}';
  if (JSON.stringify(extractObjectAt(nested, 0)) === JSON.stringify(JSON.parse(nested))) {
    pass('extractObjectAt() balances nested objects and brace/quote content inside strings');
  } else {
    fail(`extractObjectAt(nested+strings) = ${JSON.stringify(extractObjectAt(nested, 0))}`);
  }

  if (extractObjectAt('{"a":', 0) === null && extractObjectAt('not-an-object', 0) === null) {
    pass('extractObjectAt() returns null for truncated spans and non-object starts');
  } else {
    fail('extractObjectAt() should return null for truncated/non-object input');
  }

  // Synthetic careers page: one flight chunk carrying a component array with
  // a job listing; plus an unlisted job, an off-board URL, and a sparse job.
  const jobAttrs = (id, overrides = {}) => JSON.stringify({
    id: 0,
    attributes: {
      ashby_id: id,
      job_id: id,
      title: 'Engineering Manager',
      location_name: 'Italy',
      is_listed: true,
      ashby_published_date: '2026-08-21T09:59:34.086Z',
      external_link: 'https://jobs.deel.com/deel/job-details/' + id + '/application',
      compensation_tier_summary: '$$54,000 - $140,000 USD',
      full_job_description: '',
      all_locations: ['Spain', 'Portugal', 'Italy'],
      ...overrides,
    },
  });
  const payload =
    '{"components":[{"__component":"product.career-job-listing","jobs":[' +
    jobAttrs('00000000-0000-4000-8000-00000000aaaa', { title: 'Staff Engineer' }) + ',' +
    jobAttrs('00000000-0000-4000-8000-00000000bbbb', { is_listed: false }) + ',' +
    jobAttrs('00000000-0000-4000-8000-00000000cccc', { external_link: 'https://evil.example/job/1' }) + ',' +
    jobAttrs('00000000-0000-4000-8000-00000000dddd', { title: 'Engineering Manager' }) + ',' +
    jobAttrs('00000000-0000-4000-8000-00000000eeee', { ashby_published_date: 'soon', compensation_tier_summary: '' }) +
    ']}]}';
  const page =
    '<html><script>self.__next_f.push([1,"x"])</script>' +
    '<script>self.__next_f.push([1,' + JSON.stringify(payload) + '  ]);</script></html>';

  const flight = decodeFlightChunks(page);
  if (flight.length > 0 && flight.includes('ashby_id')) {
    pass('decodeFlightChunks() concatenates string payload elements across push() calls');
  } else {
    fail(`decodeFlightChunks() produced ${JSON.stringify(flight.slice(0, 40))}`);
  }

  const attrs = extractJobAttributes(flight);
  if (attrs.length === 5) pass('extractJobAttributes() extracts one attributes object per ashby_id, deduped by URL');
  else fail(`extractJobAttributes() returned ${attrs.length} objects (expected 5)`);

  if (attrs[0]?.ashby_id === '00000000-0000-4000-8000-00000000aaaa') pass('extractJobAttributes() returns full attribute objects');
  else fail(`extractJobAttributes() row 0 = ${JSON.stringify(attrs[0])}`);

  // fetch() — normalization over the synthetic payload.
  const fetched = await deel.fetch(
    { name: 'Deel', careers_url: 'https://www.deel.com/careers/' },
    { fetchText: async (url, opts) => {
        if (url !== 'https://www.deel.com/careers/') throw new Error(`unexpected url ${url}`);
        if (opts?.redirect !== 'error') throw new Error('redirect guard missing');
        return page;
      } },
  );

  // aaaa + dddd share a title but have distinct job-board URLs → both kept;
  // bbbb is unlisted, cccc points off the Deel board → dropped.
  if (fetched.length === 3) pass('deel.fetch() keeps listed on-board jobs and drops unlisted/off-board rows');
  else fail(`deel.fetch() returned ${fetched.length} rows (expected 3)`);

  const first = fetched.find((j) => j.title === 'Staff Engineer');
  if (first
      && first.url === 'https://jobs.deel.com/deel/job-details/00000000-0000-4000-8000-00000000aaaa/application'
      && first.company === 'Deel'
      && first.location === 'Spain, Portugal, Italy'
      && first.postedAt === Date.parse('2026-08-21T09:59:34.086Z')
      && first.salary?.min === 54000 && first.salary?.max === 140000 && first.salary?.currency === 'USD'
      && first.description === undefined)
    pass('deel.fetch() maps title/url/company/locations/postedAt/salary and omits empty descriptions');
  else fail(`deel.fetch() staff row = ${JSON.stringify(first)}`);

  const sparse = fetched.find((j) => j.title === 'Engineering Manager' && j.url.includes('00000000eeee'));
  if (sparse && sparse.postedAt === undefined && sparse.salary === undefined)
    pass('deel.fetch() omits postedAt/salary when the payload has no usable values');
  else fail(`deel.fetch() sparse row = ${JSON.stringify(sparse)}`);

  // Empty payload → explicit error, never a silent [].
  let emptyThrew = false;
  try {
    await deel.fetch(
      { name: 'Deel', careers_url: 'https://www.deel.com/careers/' },
      { fetchText: async () => '<html><script>self.__next_f.push([1,"no jobs here"])</script></html>' },
    );
  } catch {
    emptyThrew = true;
  }
  if (emptyThrew) pass('deel.fetch() throws a clear error when the page embeds no jobs');
  else fail('deel.fetch() should throw when no embedded jobs are found');

  // parseCompensationSummary — display-string → {min,max,currency}.
  const comp = parseCompensationSummary('$$54,000 - $140,000 USD');
  if (comp && comp.min === 54000 && comp.max === 140000 && comp.currency === 'USD') {
    pass('parseCompensationSummary() parses the doubled-$ display quirk');
  } else {
    fail(`parseCompensationSummary(display) = ${JSON.stringify(comp)}`);
  }

  const single = parseCompensationSummary('€85,000 EUR');
  if (single && single.min === 85000 && single.max === 85000 && single.currency === 'EUR') {
    pass('parseCompensationSummary() collapses a single bound into min=max');
  } else {
    fail(`parseCompensationSummary(single) = ${JSON.stringify(single)}`);
  }

  if (parseCompensationSummary(null) === null && parseCompensationSummary('') === null && parseCompensationSummary('confidential') === null) {
    pass('parseCompensationSummary() returns null for absent/blank/non-numeric summaries');
  } else {
    fail('parseCompensationSummary() should return null for absent/non-numeric input');
  }
} catch (err) {
  fail(`deel test crashed: ${err.message}`);
}
