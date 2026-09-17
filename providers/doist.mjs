// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
import { attribute, plainText, safeSameSiteUrl } from './_first-party-html.mjs';

const LIST_URL = 'https://www.todoist.com/careers';

export function resolveOpenRolesUrl(html) {
  if (typeof html !== 'string') return null;
  const match = html.match(/fetch\(\s*(["'])(\/_server-islands\/OpenRoles\?[^"']+)\1/i);
  return match ? safeSameSiteUrl(match[2], LIST_URL, /^\/_server-islands\/OpenRoles$/) : null;
}

export function parseDoistRoles(html, companyName) {
  if (typeof html !== 'string') return [];
  const jobs = [];
  for (const match of html.matchAll(/<li\b[^>]*class=["'][^"']*\brole\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    const anchor = block.match(/<a\b[^>]*href=["'][^"']*\/careers\/[^"']+["'][^>]*>[\s\S]*?<\/a>/i)?.[0] || '';
    const url = safeSameSiteUrl(attribute(anchor, 'href'), LIST_URL, /^\/careers\/[0-9a-f-]+-[a-z0-9-]+\/?$/i);
    const title = plainText(anchor);
    if (!url || !title) continue;
    const meta = block.match(/<p\b[^>]*class=["'][^"']*role-meta[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
    jobs.push({ title, url, company: companyName, location: plainText(meta) });
  }
  return jobs;
}

/** @type {Provider} */
export default {
  id: 'doist',
  detect(entry) {
    try {
      const url = new URL(entry.careers_url || '');
      return url.protocol === 'https:' && /^(?:www\.)?(?:doist|todoist)\.com$/.test(url.hostname) && url.pathname.startsWith('/careers') ? { url: LIST_URL } : null;
    } catch { return null; }
  },
  async fetch(entry, ctx) {
    if (!this.detect(entry)) throw new Error(`doist: unsupported careers URL for ${entry.name}`);
    const page = await ctx.fetchText(LIST_URL, { redirect: 'error' });
    const rolesUrl = resolveOpenRolesUrl(page);
    if (!rolesUrl) return [];
    const roles = await ctx.fetchText(rolesUrl, { redirect: 'error' });
    return parseDoistRoles(roles, entry.name);
  },
};
