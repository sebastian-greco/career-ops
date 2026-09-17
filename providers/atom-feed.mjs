// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
import { attribute, plainText, safeSameSiteUrl } from './_first-party-html.mjs';

function resolveFeed(entry) {
  if (typeof entry.api !== 'string' || typeof entry.careers_url !== 'string') return null;
  const url = safeSameSiteUrl(entry.api, entry.careers_url, /\.(?:atom|xml)$/i);
  return url;
}

function element(xml, name) {
  const match = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? match[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '') : '';
}

export function parseAtomFeed(xml, companyName, feedUrl) {
  if (typeof xml !== 'string') return [];
  const jobs = [];
  const seen = new Set();
  for (const match of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const entry = match[1];
    const title = plainText(element(entry, 'title'));
    const linkTags = [...entry.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
    const preferred = linkTags.find(tag => !attribute(tag, 'rel') || attribute(tag, 'rel') === 'alternate') || '';
    const rawUrl = attribute(preferred, 'href') || plainText(element(entry, 'id'));
    const url = safeSameSiteUrl(rawUrl, feedUrl);
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);
    const description = plainText(element(entry, 'content') || element(entry, 'summary'));
    const stamp = Date.parse(plainText(element(entry, 'published') || element(entry, 'updated')));
    const job = { title, url, company: companyName, location: '' };
    if (description) job.description = description;
    if (Number.isFinite(stamp)) job.postedAt = stamp;
    jobs.push(job);
  }
  return jobs;
}

/** @type {Provider} */
export default {
  id: 'atom-feed',
  detect(entry) {
    const url = resolveFeed(entry);
    return url ? { url } : null;
  },
  async fetch(entry, ctx) {
    const url = resolveFeed(entry);
    if (!url) throw new Error(`atom-feed: api must be a same-site HTTPS .xml/.atom URL for ${entry.name}`);
    const xml = await ctx.fetchText(url, { redirect: 'error' });
    return parseAtomFeed(xml, entry.name, url);
  },
};
