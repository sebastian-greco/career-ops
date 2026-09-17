import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — aiven');
try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/aiven.mjs')).href);
  const provider = mod.default;
  const data = { '@type': 'ItemList', itemListElement: [{ item: { '@type': 'JobPosting', title: 'Engineering Manager', description: '<p>Lead AI.</p>', datePosted: '2026-09-01', jobLocation: [{ address: { addressLocality: 'Helsinki' } }] } }] };
  const html = `<script type="application/ld+json">${JSON.stringify(data)}</script><a href="/careers/job/12345">role</a>`;
  const jobs = mod.parseAivenHtml(html, 'Aiven');
  if (provider.detect({ careers_url: 'https://aiven.io/careers/job' }) && jobs[0]?.title === 'Engineering Manager'
      && jobs[0]?.url === 'https://aiven.io/careers/job/12345' && jobs[0]?.location === 'Helsinki' && jobs[0]?.description === 'Lead AI.') {
    pass('aiven parses its first-party JobPosting list and stable detail links');
  } else fail(`aiven parse=${JSON.stringify(jobs)}`);
  if (provider.detect({ careers_url: 'https://evil.example/careers/job' }) === null
      && mod.parseAivenHtml(html.replace('/careers/job/12345', 'https://evil.example/careers/job/12345'), 'Aiven').length === 0) {
    pass('aiven rejects unsupported and off-site URLs');
  } else fail('aiven URL security failed');
} catch (e) { fail(`aiven provider tests crashed: ${e.message}`); }
