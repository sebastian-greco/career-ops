import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — meshpayments');
try {
  const mod = await import(pathToFileURL(join(ROOT, 'providers/meshpayments.mjs')).href);
  const provider = mod.default;
  const html = `<div class="uc_post_list_title"><a href="https://meshpayments.com/careers/security-it-manager/">Head of Security and IT <span class="uc_post_list_location">(Tel Aviv)</span></a></div>`;
  const jobs = mod.parseMeshPaymentsHtml(html, 'Mesh Payments');
  if (provider.detect({ careers_url: 'https://meshpayments.com/careers/' }) && jobs[0]?.title === 'Head of Security and IT'
      && jobs[0]?.location === '(Tel Aviv)' && jobs[0]?.url === 'https://meshpayments.com/careers/security-it-manager/') pass('meshpayments parses first-party WordPress career cards');
  else fail(`meshpayments parse=${JSON.stringify(jobs)}`);
  if (mod.parseMeshPaymentsHtml(html.replace('meshpayments.com', 'evil.example'), 'Mesh').length === 0) pass('meshpayments drops off-site posting URLs');
  else fail('meshpayments accepted an off-site posting URL');
} catch (e) { fail(`meshpayments provider tests crashed: ${e.message}`); }
