import { decodeEntities } from './_html-entities.mjs';

/** Convert the small HTML fragments exposed by listing pages to filterable text. */
export function plainText(html) {
  if (typeof html !== 'string') return '';
  return decodeEntities(html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match ? decodeEntities(match[2]).trim() : '';
}

export function normalizedHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

export function safeSameSiteUrl(raw, base, pathPattern) {
  try {
    const url = new URL(decodeEntities(raw), base);
    const baseUrl = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (normalizedHost(url.hostname) !== normalizedHost(baseUrl.hostname)) return null;
    if (pathPattern && !pathPattern.test(url.pathname)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}
