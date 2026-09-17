// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
import { attribute, plainText, safeSameSiteUrl } from './_first-party-html.mjs';

const LIST_URL = 'https://serpapi.com/careers';

export function parseSerpApiHtml(html, companyName) {
  if (typeof html !== 'string') return [];
  const jobs = [];
  const seen = new Set();
  for (const match of html.matchAll(/<a\b[^>]*href=["'][^"']*\/careers\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const tag = match[0].slice(0, match[0].indexOf('>') + 1);
    const url = safeSameSiteUrl(attribute(tag, 'href'), LIST_URL, /^\/careers\/[a-z0-9][a-z0-9-]+\/?$/i);
    const inner = match[1];
    const title = plainText(inner.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '');
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    const location = plainText(inner.match(/<ul\b[^>]*class=["'][^"']*summary[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '');
    const description = plainText(inner.match(/<p\b[^>]*class=["'][^"']*mb-4[^"']*["'][^>]*>([\s\S]*?)<span\b/i)?.[1] || '');
    const job = { title, url, company: companyName, location };
    if (description) job.description = description;
    jobs.push(job);
  }
  return jobs;
}

/** @type {Provider} */
export default {
  id: 'serpapi',
  detect(entry) {
    try {
      const url = new URL(entry.careers_url || '');
      return url.protocol === 'https:' && /^(?:www\.)?serpapi\.com$/.test(url.hostname) && url.pathname.startsWith('/careers') ? { url: LIST_URL } : null;
    } catch { return null; }
  },
  async fetch(entry, ctx) {
    if (!this.detect(entry)) throw new Error(`serpapi: unsupported careers URL for ${entry.name}`);
    const html = await ctx.fetchText(LIST_URL, { redirect: 'error' });
    return parseSerpApiHtml(html, entry.name);
  },
};
