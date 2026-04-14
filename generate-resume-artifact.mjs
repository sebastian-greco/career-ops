#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

function usage() {
  console.log(`Usage:
  node generate-resume-artifact.mjs --role "Director of Engineering" [options]

Options:
  --company <name>       Company name used in output filename
  --role <title>         Role title used for template selection and output filename
  --template <name>      Force template: leadership | ic
  --report <path>        Optional report markdown path used for tailoring
  --output <path>        Custom output path
  --date <YYYY-MM-DD>    Override date in output filename
  --artifact <type>      Artifact type (default: profile resume.artifact_default)
  --dry-run              Print selection and output path without writing file
  --help                 Show this help
`);
}

function parseArgs(argv) {
  const args = { dryRun: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unknown positional argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeForMatch(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesConfiguredRole(role, patterns = []) {
  const normalizedRole = normalizeForMatch(role);
  if (!normalizedRole) return false;

  return patterns.some((pattern) => {
    const normalizedPattern = normalizeForMatch(pattern);
    if (!normalizedPattern) return false;
    return normalizedRole.includes(normalizedPattern) || normalizedPattern.includes(normalizedRole);
  });
}

function resolveFromRoot(root, filePath) {
  return isAbsolute(filePath) ? filePath : resolve(root, filePath);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadProfile() {
  const profilePath = join(__dirname, 'config', 'profile.yml');
  if (!existsSync(profilePath)) {
    throw new Error('config/profile.yml not found');
  }

  const profile = yaml.load(readFileSync(profilePath, 'utf-8'));
  return profile || {};
}

function pickTemplate(role, resumeConfig, forcedTemplate) {
  if (forcedTemplate) {
    if (!['leadership', 'ic'].includes(forcedTemplate)) {
      throw new Error(`Unsupported template "${forcedTemplate}". Use leadership or ic.`);
    }
    return forcedTemplate;
  }

  const templates = resumeConfig.templates || {};
  if (matchesConfiguredRole(role, templates.ic?.use_for)) return 'ic';
  if (matchesConfiguredRole(role, templates.leadership?.use_for)) return 'leadership';
  return 'leadership';
}

function getTemplatePath(templateName, resumeConfig) {
  const defaults = {
    leadership: 'resumes/leadership-base.json',
    ic: 'resumes/ic-base.json',
  };

  return resumeConfig.templates?.[templateName]?.base_json || defaults[templateName];
}

function buildOutputPath({ company, role, outputOverride, outputDir, candidateName, date }) {
  if (outputOverride) return resolveFromRoot(__dirname, outputOverride);

  const candidateSlug = slugify(candidateName) || 'candidate';
  const jobSlug = slugify([company, role].filter(Boolean).join(' ')) || 'resume';
  const fileName = `cv-${candidateSlug}-${jobSlug}-${date}.json`;
  return resolveFromRoot(__dirname, join(outputDir, fileName));
}

function findReportPath({ company, role, reportOverride }) {
  if (reportOverride) {
    const resolved = resolveFromRoot(__dirname, reportOverride);
    return existsSync(resolved) ? resolved : null;
  }

  const reportsDir = join(__dirname, 'reports');
  if (!existsSync(reportsDir)) return null;

  const companySlug = slugify(company);
  const roleSlug = slugify(role);
  const files = readdirSync(reportsDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => file.includes(companySlug) && file.includes(roleSlug))
    .sort()
    .reverse();

  if (files.length === 0) return null;
  return join(reportsDir, files[0]);
}

function sectionBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return '';
  const afterStart = text.slice(start + startMarker.length);
  const end = endMarker ? afterStart.indexOf(endMarker) : -1;
  return end === -1 ? afterStart : afterStart.slice(0, end);
}

function extractBullets(sectionText) {
  return sectionText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseReport(reportPath) {
  if (!reportPath || !existsSync(reportPath)) return null;
  const text = readFileSync(reportPath, 'utf-8');

  const scoreMatch = text.match(/\*\*Score:\*\*\s*([0-9.]+\/5)/);
  const archetypeMatch = text.match(/\*\*Archetype:\*\*\s*(.+)/);
  const roleSummarySection = sectionBetween(text, '## A) Role Summary', '## B) CV Match');
  const cvMatchSection = sectionBetween(text, '## B) CV Match', '## C) Fit Read');
  const recommendationSection = sectionBetween(text, '## D) Recommendation', '## E) Artifact');
  const keywordsSection = sectionBetween(text, '## Keywords Extracted', null);

  const summaryRowMatch = roleSummarySection.match(/\| \*\*TL;DR\*\* \| (.+?) \|/);
  const domainRowMatch = roleSummarySection.match(/\| \*\*Domain\*\* \| (.+?) \|/);
  const remoteRowMatch = roleSummarySection.match(/\| \*\*Remote\*\* \| (.+?) \|/);
  const strongest = extractBullets(sectionBetween(cvMatchSection, '**Strongest overlaps**', '**Gaps / risks**'));
  const concerns = extractBullets(sectionBetween(cvMatchSection, '**Gaps / risks**', '## C) Fit Read'));
  const recommendationLine = recommendationSection
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^(APPLY|CONSIDER|SKIP)\s*-/.test(line)) || '';

  const keywords = keywordsSection
    .replace(/\s+/g, ' ')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    path: reportPath,
    score: scoreMatch?.[1] || '',
    archetype: archetypeMatch?.[1]?.trim() || '',
    tldr: summaryRowMatch?.[1]?.trim() || '',
    domain: domainRowMatch?.[1]?.trim() || '',
    remote: remoteRowMatch?.[1]?.trim() || '',
    strongest,
    concerns,
    recommendationLine,
    keywords,
  };
}

function paragraphize(paragraphs) {
  return paragraphs.filter(Boolean).map((text) => `<p>${text}</p>`).join('');
}

function bulletsToHtml(bullets) {
  const items = bullets.filter(Boolean).map((bullet) => `<li><p>${bullet}</p></li>`).join('');
  return items ? `<ul>${items}</ul><p></p>` : '<p></p>';
}

function pickKeywords(keywords, limit = 6) {
  return keywords
    .filter((keyword) => keyword.length <= 32)
    .filter((keyword) => !/(staff|principal|senior|engineer|engineering|remote|product judgment)/i.test(keyword))
    .slice(0, limit);
}

function inferFocus(report, templateName) {
  const archetype = report?.archetype || '';
  const domain = report?.domain || '';
  const combined = `${archetype} ${domain}`.toLowerCase();

  if (combined.includes('product') || combined.includes('full-stack')) return 'product';
  if (combined.includes('crypto') || combined.includes('web3')) return 'crypto';
  if (combined.includes('agentic') || combined.includes('ai')) return 'ai';
  if (combined.includes('platform') || combined.includes('backend')) return 'backend';
  return templateName === 'leadership' ? 'leadership' : 'backend';
}

function chooseHeadline(templateName, report) {
  const focus = inferFocus(report, templateName);
  if (templateName === 'leadership') {
    if (focus === 'product') return 'Product-Minded Engineering Leader';
    if (focus === 'backend') return 'Platform Engineering Leader';
    return 'Engineering Leader & Founder';
  }

  if (focus === 'product') return 'Product-Minded Backend Engineer';
  if (focus === 'crypto') return 'Backend Engineering Leader';
  return 'Backend Engineering Leader';
}

function buildSummary(templateName, report, role) {
  const focus = inferFocus(report, templateName);

  if (templateName === 'leadership') {
    if (focus === 'product') {
      return paragraphize([
        'Engineering leader and founder with nearly 20 years of experience across startups, scale-ups, and product-heavy organizations.',
        'Strongest in building teams, shaping technical direction, and helping engineers deliver quickly without losing quality or sustainability.',
        'Particularly well suited to product and platform leadership roles where execution, system design, and healthy culture all matter.',
      ]);
    }

    return paragraphize([
      'Engineering leader and founder with nearly 20 years of experience scaling product and platform teams across agency, startup, and scale-up environments.',
      'Strongest in backend and platform architecture, org design, hiring, and pragmatic delivery in fast-moving companies.',
      `Best suited to ${role.toLowerCase()} opportunities where technical depth, leadership range, and sustainable execution all matter.`,
    ]);
  }

  if (focus === 'product') {
    return paragraphize([
      'Backend and product-minded engineering leader with nearly 20 years of experience building user-facing software, APIs, and platform services.',
      'Strongest hands-on background is in Node.js, TypeScript, NestJS, platform evolution, and shipping product work in fast-growing environments.',
      `Particularly well suited to ${role.toLowerCase()} roles where product judgment, technical autonomy, and reliable delivery all matter.`,
    ]);
  }

  if (focus === 'ai') {
    return paragraphize([
      'Backend engineering leader with nearly 20 years of experience building APIs, distributed systems, and product platforms in startup and scale-up environments.',
      'Strongest hands-on background is in Node.js, TypeScript, event-driven architecture, reliability work, and practical AI-assisted product development.',
      `Particularly well suited to ${role.toLowerCase()} roles where backend depth, system design, and modern AI-enabled workflows all matter.`,
    ]);
  }

  return paragraphize([
    'Backend engineering leader with nearly 20 years of experience building product platforms, APIs, and distributed systems in startup and scale-up environments.',
    'Strongest hands-on background is in Node.js, TypeScript, event-driven architecture, platform evolution, and performance work in fast-growing product teams.',
    `Particularly well suited to ${role.toLowerCase()} roles where reliability, product judgment, and technical leadership all matter.`,
  ]);
}

function updateSkills(baseResume, report, templateName) {
  const skills = baseResume.sections?.skills?.items;
  if (!Array.isArray(skills)) return;

  const focus = inferFocus(report, templateName);
  const focusKeywords = {
    leadership: ['Engineering Leadership', 'Org Design', 'Hiring', 'Technical Direction'],
    backend: ['Distributed Systems', 'API Design', 'Data Pipelines', 'Reliability'],
    product: ['JavaScript', 'Node.js', 'React', 'Product Engineering'],
    ai: ['AI Tooling', 'LLM Workflows', 'Evaluation Frameworks', 'Data Pipelines'],
    crypto: ['Backend Systems', 'APIs', 'Reliability', 'Trust & Safety'],
  };
  const keywords = [...(focusKeywords[focus] || []), ...pickKeywords(report?.keywords || [], templateName === 'leadership' ? 4 : 6)];
  if (keywords.length === 0) return;

  const firstSkill = skills[0];
  if (!firstSkill || !Array.isArray(firstSkill.keywords)) return;

  const existing = new Set(firstSkill.keywords.map((keyword) => keyword.toLowerCase()));
  for (const keyword of keywords) {
    if (!existing.has(keyword.toLowerCase())) {
      firstSkill.keywords.unshift(keyword);
      existing.add(keyword.toLowerCase());
    }
  }

  firstSkill.keywords = Array.from(new Set(firstSkill.keywords)).slice(0, 14);
}

function updateProjects(baseResume, report) {
  const projects = baseResume.sections?.projects?.items;
  if (!Array.isArray(projects) || !report) return;

  const domain = (report.domain || '').toLowerCase();
  if (!domain) return;

  if (domain.includes('platform') || domain.includes('backend')) {
    projects.sort((a, b) => {
      const order = ['Informia', 'Verba', 'FallosES'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  }

  if (domain.includes('product')) {
    projects.sort((a, b) => {
      const order = ['Verba', 'Informia', 'FallosES'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  }
}

function updateExperience(baseResume, report, templateName) {
  const experienceItems = baseResume.sections?.experience?.items;
  if (!Array.isArray(experienceItems) || experienceItems.length === 0) return;

  const riverside = experienceItems.find((item) => item.company === 'Riverside');
  if (!riverside) return;

  const focus = inferFocus(report, templateName);

  if (templateName === 'leadership') {
    if (Array.isArray(riverside.roles) && riverside.roles[0]) {
      riverside.roles[0].description = bulletsToHtml([
        'Led a group of 27 engineers and managers across 4 teams, balancing delivery, technical direction, hiring, and org design during rapid growth.',
        'Acted as an architectural reviewer across backend and platform work, with final sign-off on complex features touching shared infrastructure.',
        focus === 'product'
          ? 'Stayed close to product and platform execution, helping teams break complex work into smaller, faster delivery loops.'
          : 'Drove the backend evolution from a monolith toward an event-driven architecture using Kafka and Protobuf so teams could scale more independently.',
      ]);
    }
    if (Array.isArray(riverside.roles) && riverside.roles[1]) {
      riverside.roles[1].description = bulletsToHtml([
        focus === 'product'
          ? 'Led the team responsible for core platform services and the main user dashboard, shipping work that crossed backend, product, and internal platform boundaries.'
          : 'Led the team responsible for core platform services and the main user dashboard, shipping work that crossed backend, product, and internal platform boundaries.',
        'Built the company\'s first formal full-stack team from a previously flat structure, then hired and grew the team as the platform scope expanded.',
        'Worked closely on API and platform design for high-traffic product surfaces, with a strong focus on reliability and performance.',
      ]);
    }
  } else {
    if (Array.isArray(riverside.roles) && riverside.roles[1]) {
      riverside.roles[1].description = bulletsToHtml([
        focus === 'product'
          ? 'Led the team responsible for core platform services and the main user dashboard, shipping work across backend, product, and internal platform boundaries.'
          : 'Led the team responsible for core platform services and the main user dashboard, shipping work across backend, product, and internal platform boundaries.',
        focus === 'product'
          ? 'Built the company\'s first formal full-stack team from a previously flat structure, then hired and grew the team as the platform scope expanded.'
          : 'Guided the extraction of critical services from the backend monolith, contributing to a 33% reduction in overall system latency.',
        focus === 'product'
          ? 'Worked closely on high-traffic user-facing product surfaces, balancing speed, reliability, and technical tradeoffs.'
          : 'Worked closely on API and platform design for high-traffic product surfaces, with a strong focus on reliability and performance.',
      ]);
    }
  }

  const customExperience = baseResume.customSections?.find((section) => section.type === 'experience');
  if (!customExperience || !Array.isArray(customExperience.items) || customExperience.items.length === 0) return;
  const firstCustom = customExperience.items[0];
  if (!Array.isArray(firstCustom.roles) || !firstCustom.roles[0]) return;

  firstCustom.roles[0].description = bulletsToHtml(
    focus === 'product'
      ? [
          'Joined as an early engineer and worked across core product and backend systems during the company\'s early growth, using Node.js and NestJS in a fast-moving environment.',
          'Resolved application and database bottlenecks while becoming a go-to engineer for backend, APIs, and technical design tradeoffs.',
        ]
      : [
          'Joined as an early engineer and worked on core backend systems during the company\'s early growth, using Node.js and NestJS in a fast-moving environment.',
          'Resolved application and database bottlenecks, improving reliability, and became a go-to engineer for backend, APIs, and technical design tradeoffs.',
        ]
  );
}

function tailorResume(baseResume, { templateName, report, role, company }) {
  const tailored = deepClone(baseResume);

  if (tailored.basics) {
    tailored.basics.headline = chooseHeadline(templateName, report);
  }

  if (tailored.summary) {
    tailored.summary.content = buildSummary(templateName, report, role) || tailored.summary.content;
  }

  updateExperience(tailored, report, templateName);
  updateSkills(tailored, report, templateName);
  updateProjects(tailored, report);

  if (tailored.metadata?.notes !== undefined) {
    tailored.metadata.notes = report
      ? `Tailored for ${company} - ${role} using ${relative(__dirname, report.path)}`
      : `Generated from ${templateName} base template for ${company} - ${role}`;
  }

  return tailored;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  if (!args.role) {
    usage();
    throw new Error('--role is required');
  }

  const profile = loadProfile();
  const resumeConfig = profile.resume || {};
  const artifactType = args.artifact || resumeConfig.artifact_default || 'rxresume_json';

  if (artifactType !== 'rxresume_json') {
    throw new Error(`Unsupported artifact type "${artifactType}". This script currently generates only rxresume_json.`);
  }

  const templateName = pickTemplate(args.role, resumeConfig, args.template);
  const templatePath = resolveFromRoot(__dirname, getTemplatePath(templateName, resumeConfig));

  if (!existsSync(templatePath)) {
    throw new Error(`Base template not found: ${relative(__dirname, templatePath)}`);
  }

  const outputDir = resumeConfig.output_dir || 'output';
  const date = args.date || new Date().toISOString().slice(0, 10);
  const outputPath = buildOutputPath({
    company: args.company || '',
    role: args.role,
    outputOverride: args.output,
    outputDir,
    candidateName: profile.candidate?.full_name || 'candidate',
    date,
  });

  const reportPath = findReportPath({ company: args.company || '', role: args.role, reportOverride: args.report });
  const report = parseReport(reportPath);
  const baseResume = JSON.parse(readFileSync(templatePath, 'utf-8'));
  const tailoredResume = tailorResume(baseResume, {
    templateName,
    report,
    role: args.role,
    company: args.company || '',
  });

  const result = {
    artifactType,
    template: templateName,
    source: relative(__dirname, templatePath),
    report: reportPath ? relative(__dirname, reportPath) : '',
    output: relative(__dirname, outputPath),
    company: args.company || '',
    role: args.role,
    tailored: Boolean(report),
    dryRun: Boolean(args.dryRun),
  };

  if (!args.dryRun) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(tailoredResume, null, 2)}\n`);
  }

  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
