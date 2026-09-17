import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — atom-feed');
try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/atom-feed.mjs')).href);
  const provider = mod.default;
  const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Engineering Manager &amp; AI</title><link rel="alternate" href="https://fly.io/jobs/manager/"/><published>2026-09-01T12:00:00Z</published><content type="html"><![CDATA[<p>Lead the team.</p>]]></content></entry></feed>`;
  const jobs = mod.parseAtomFeed(xml, 'Fly.io', 'https://fly.io/jobs/feed.xml');
  if (provider.id === 'atom-feed' && jobs[0]?.title === 'Engineering Manager & AI' && jobs[0]?.description === 'Lead the team.'
      && jobs[0]?.postedAt === Date.parse('2026-09-01T12:00:00Z')) pass('atom feed parses title, same-site URL, content, and date');
  else fail(`atom feed parse=${JSON.stringify(jobs)}`);
  if (provider.detect({ name: 'Fly', careers_url: 'https://fly.io/jobs/', api: 'https://fly.io/jobs/feed.xml' })?.url
      === 'https://fly.io/jobs/feed.xml') pass('atom-feed detects an explicit same-site XML feed');
  else fail('atom-feed should detect a same-site XML feed');
  if (provider.detect({ name: 'Evil', careers_url: 'https://fly.io/jobs/', api: 'https://evil.example/feed.xml' }) === null
      && mod.parseAtomFeed(xml.replace('https://fly.io/jobs/manager/', 'https://evil.example/job'), 'Fly', 'https://fly.io/jobs/feed.xml').length === 0) {
    pass('atom-feed rejects off-site feed and posting URLs');
  } else fail('atom-feed same-site security failed');
} catch (e) { fail(`atom-feed provider tests crashed: ${e.message}`); }
