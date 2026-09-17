import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — doist');
try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/doist.mjs')).href);
  const provider = mod.default;
  const page = `<script>let response = await fetch("/_server-islands/OpenRoles?e=abc&amp;p=def", { headers });</script>`;
  const roles = `<li class="role" data-department="Design"><a class="role-link" href="/careers/8e2799aa-aaaa-bbbb-cccc-brand-design-lead">Brand Design Lead</a><p class="role-meta"><span>Full-time</span><span>•</span><span>Remote</span></p></li>`;
  const url = mod.resolveOpenRolesUrl(page);
  const jobs = mod.parseDoistRoles(roles, 'Doist');
  if (provider.detect({ careers_url: 'https://doist.com/careers#open-roles' }) && url === 'https://www.todoist.com/_server-islands/OpenRoles?e=abc&p=def'
      && jobs[0]?.title === 'Brand Design Lead' && jobs[0]?.location.includes('Remote')) pass('doist resolves the signed server-island request and parses roles');
  else fail(`doist url=${url}, jobs=${JSON.stringify(jobs)}`);
  if (provider.detect({ careers_url: 'https://evil.example/careers' }) === null
      && mod.parseDoistRoles(roles.replace('/careers/', 'https://evil.example/careers/'), 'Doist').length === 0) pass('doist rejects unsupported and off-site role URLs');
  else fail('doist URL security failed');
} catch (e) { fail(`doist provider tests crashed: ${e.message}`); }
