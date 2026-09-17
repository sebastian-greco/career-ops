// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
import { attribute, plainText, safeSameSiteUrl } from './_first-party-html.mjs';

const LIST_URL = 'https://meshpayments.com/careers/';

export function parseMeshPaymentsHtml(html, companyName) {
  if (typeof html !== 'string') return [];
  const jobs = [];
  const seen = new Set();
  for (const match of html.matchAll(/<div\b[^>]*class=["'][^"']*uc_post_list_title[^"']*["'][^>]*>\s*(<a\b[^>]*>[\s\S]*?<\/a>)/gi)) {
    const anchor = match[1];
    const tag = anchor.slice(0, anchor.indexOf('>') + 1);
    const url = safeSameSiteUrl(attribute(tag, 'href'), LIST_URL, /^\/careers\/[a-z0-9][a-z0-9-]+\/?$/i);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const location = plainText(anchor.match(/<span\b[^>]*class=["'][^"']*uc_post_list_location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || '');
    const title = plainText(anchor.replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi, ' '));
    if (title) jobs.push({ title, url, company: companyName, location });
  }
  return jobs;
}

/** @type {Provider} */
export default {
  id: 'meshpayments',
  detect(entry) {
    try {
      const url = new URL(entry.careers_url || '');
      return url.protocol === 'https:' && /^(?:www\.)?meshpayments\.com$/.test(url.hostname) && url.pathname.startsWith('/careers') ? { url: LIST_URL } : null;
    } catch { return null; }
  },
  async fetch(entry, ctx) {
    if (!this.detect(entry)) throw new Error(`meshpayments: unsupported careers URL for ${entry.name}`);
    const html = await ctx.fetchText(LIST_URL, { redirect: 'error' });
    return parseMeshPaymentsHtml(html, entry.name);
  },
};
