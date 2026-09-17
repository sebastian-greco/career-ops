// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
import { attribute, plainText, safeSameSiteUrl } from './_first-party-html.mjs';

const LIST_URL = 'https://aiven.io/careers/job';

export function parseAivenHtml(html, companyName) {
  if (typeof html !== 'string') return [];
  const script = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1])
    .find(body => body.includes('JobPosting'));
  if (!script) return [];
  let data;
  try { data = JSON.parse(script); } catch { return []; }
  const postings = Array.isArray(data?.itemListElement) ? data.itemListElement.map(x => x?.item).filter(Boolean) : [];
  const urls = [];
  for (const anchor of html.matchAll(/<a\b[^>]*href=["'][^"']*\/careers\/job\/[^"']+["'][^>]*>/gi)) {
    const url = safeSameSiteUrl(attribute(anchor[0], 'href'), LIST_URL, /^\/careers\/job\/\d+\/?$/);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return postings.slice(0, urls.length).map((p, i) => {
    const locations = (Array.isArray(p.jobLocation) ? p.jobLocation : [p.jobLocation])
      .map(x => x?.address?.addressLocality || x?.address?.addressRegion || x?.address?.addressCountry)
      .filter(Boolean);
    const job = {
      title: typeof p.title === 'string' ? p.title.trim() : '',
      url: urls[i],
      company: companyName,
      location: [...new Set(locations)].join(' · '),
    };
    const description = plainText(p.description || '');
    if (description) job.description = description;
    const stamp = Date.parse(p.datePosted || '');
    if (Number.isFinite(stamp)) job.postedAt = stamp;
    return job;
  }).filter(j => j.title && j.url);
}

/** @type {Provider} */
export default {
  id: 'aiven',
  detect(entry) {
    try {
      const url = new URL(entry.careers_url || '');
      return url.protocol === 'https:' && /^(?:www\.)?aiven\.io$/.test(url.hostname) && url.pathname.startsWith('/careers/job') ? { url: LIST_URL } : null;
    } catch { return null; }
  },
  async fetch(entry, ctx) {
    if (!this.detect(entry)) throw new Error(`aiven: unsupported careers URL for ${entry.name}`);
    const html = await ctx.fetchText(LIST_URL, { redirect: 'error' });
    return parseAivenHtml(html, entry.name);
  },
};
