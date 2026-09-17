import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — serpapi');
try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/serpapi.mjs')).href);
  const provider = mod.default;
  const html = `<a href="/careers/senior-fullstack-engineer" class="card"><div><h3>Senior Fullstack Engineer</h3><ul class="summary"><li>Remote-first</li><li>Full-time</li></ul></div><p class="mb-4"><p>Build search infrastructure.</p></p><span>Learn more</span></a>`;
  const jobs = mod.parseSerpApiHtml(html, 'SerpApi');
  if (provider.detect({ careers_url: 'https://serpapi.com/careers' }) && jobs[0]?.title === 'Senior Fullstack Engineer'
      && jobs[0]?.url === 'https://serpapi.com/careers/senior-fullstack-engineer' && jobs[0]?.location.includes('Remote-first')) pass('serpapi parses first-party career cards');
  else fail(`serpapi parse=${JSON.stringify(jobs)}`);
  if (provider.detect({ careers_url: 'https://evil.example/careers' }) === null) pass('serpapi only detects its exact first-party host');
  else fail('serpapi host detection was too broad');
} catch (e) { fail(`serpapi provider tests crashed: ${e.message}`); }
