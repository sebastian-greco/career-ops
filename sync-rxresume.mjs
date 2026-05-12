#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));

function loadDotenvFallback() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

try {
  const { config } = await import('dotenv');
  config();
} catch {
  loadDotenvFallback();
}
const REPORTS_DIR = join(ROOT, 'reports');
const OUTPUT_DIR = join(ROOT, 'output');

function usage() {
  console.log(`Usage:
  node sync-rxresume.mjs <report-id|report-path|resume-json> [--dry-run]

Examples:
  node sync-rxresume.mjs 369
  node sync-rxresume.mjs reports/369-wundergraph-inc-head-of-engineering-2026-05-07.md
  node sync-rxresume.mjs output/369-cv-sebastian-greco-wundergraph-inc-head-of-engineering-2026-05-07.json --dry-run
`);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = { dryRun: false };
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      flags.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    positionals.push(arg);
  }

  if (positionals.length === 0) {
    usage();
    process.exit(1);
  }

  return { target: positionals[0], dryRun: flags.dryRun };
}

function resolveReportPath(target) {
  if (/^\d+$/.test(target)) {
    const padded = String(target).padStart(3, '0');
    const matches = readdirSync(REPORTS_DIR)
      .filter((file) => file.startsWith(`${padded}-`) && file.endsWith('.md'))
      .sort((left, right) => {
        const leftIsSkills = left.endsWith('-skills.md');
        const rightIsSkills = right.endsWith('-skills.md');
        if (leftIsSkills === rightIsSkills) return left.localeCompare(right);
        return leftIsSkills ? 1 : -1;
      });
    const match = matches[0];
    if (!match) throw new Error(`Could not resolve report id ${target}`);
    return join(REPORTS_DIR, match);
  }

  const absolute = resolve(target);
  if (!existsSync(absolute)) throw new Error(`Path not found: ${absolute}`);
  if (!absolute.endsWith('.md')) throw new Error('Report path must end with .md');
  return absolute;
}

function parseReportMeta(reportPath, raw) {
  const reportFile = basename(reportPath);
  const reportNum = reportFile.match(/^(\d+)-/)?.[1] || '';
  const headerMatch = raw.match(/^# Evaluation: (.+?) -- (.+)$/m);
  const company = headerMatch?.[1]?.trim() || '';
  const role = headerMatch?.[2]?.trim() || '';
  const artifactMatch = raw.match(/- Resume artifact generated: `([^`]+\.json)`/);

  return {
    reportNum,
    company,
    role,
    artifactPath: artifactMatch ? resolve(ROOT, artifactMatch[1]) : '',
  };
}

function findBestArtifact(reportMeta) {
  if (reportMeta.artifactPath && existsSync(reportMeta.artifactPath)) {
    return reportMeta.artifactPath;
  }

  const files = readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ file, absolutePath: join(OUTPUT_DIR, file) }));

  const prefixed = reportMeta.reportNum
    ? files.filter(({ file }) => file.startsWith(`${reportMeta.reportNum}-`))
    : [];

  if (prefixed.length === 1) return prefixed[0].absolutePath;
  if (prefixed.length > 1) {
    return prefixed
      .sort((left, right) => statSync(right.absolutePath).mtimeMs - statSync(left.absolutePath).mtimeMs)[0]
      .absolutePath;
  }

  const companySlug = slugify(reportMeta.company);
  const roleSlug = slugify(reportMeta.role);
  const matched = files.filter(({ file }) => file.includes(companySlug) && (!roleSlug || file.includes(roleSlug)));
  if (matched.length === 1) return matched[0].absolutePath;
  if (matched.length > 1) {
    return matched
      .sort((left, right) => statSync(right.absolutePath).mtimeMs - statSync(left.absolutePath).mtimeMs)[0]
      .absolutePath;
  }

  throw new Error('Could not locate the paired JSON artifact for this report');
}

function collectCompanyRoles() {
  const rolesByCompany = new Map();
  for (const file of readdirSync(REPORTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const absolutePath = join(REPORTS_DIR, file);
    const raw = readFileSync(absolutePath, 'utf8');
    const match = raw.match(/^# Evaluation: (.+?) -- (.+)$/m);
    if (!match) continue;
    const companyKey = slugify(match[1]);
    if (!rolesByCompany.has(companyKey)) rolesByCompany.set(companyKey, new Set());
    rolesByCompany.get(companyKey).add(match[2].trim());
  }
  return rolesByCompany;
}

function buildResumeName(candidateName, reportMeta, rolesByCompany) {
  if (!reportMeta.company) return candidateName;
  const baseName = `${candidateName} - ${reportMeta.company}`;
  const companyRoles = rolesByCompany.get(slugify(reportMeta.company));
  if (companyRoles && companyRoles.size > 1 && reportMeta.role) {
    return `${baseName} - ${reportMeta.role}`;
  }
  return baseName;
}

function buildResumeSlug(candidateName, reportMeta) {
  const parts = [reportMeta.reportNum, candidateName, reportMeta.company, reportMeta.role].filter(Boolean);
  return slugify(parts.join(' ')).slice(0, 120);
}

function buildTags(reportMeta) {
  return [
    'career-ops',
    'rxresume-json',
    reportMeta.reportNum ? `report-${reportMeta.reportNum}` : '',
    reportMeta.company ? `company-${slugify(reportMeta.company)}` : '',
  ].filter(Boolean);
}

function validateResumeArtifact(jsonPath) {
  execFileSync('node', [join(ROOT, 'validate-resume-json.mjs'), jsonPath], {
    cwd: ROOT,
    stdio: 'ignore',
  });
}

async function apiRequest(pathname, init = {}) {
  const baseUrl = process.env.RX_RESUME_URL;
  const apiKey = process.env.RX_RESUME_KEY;

  if (!baseUrl) throw new Error('Missing RX_RESUME_URL');
  if (!apiKey) throw new Error('Missing RX_RESUME_KEY');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/openapi${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(init.headers || {}),
    },
  });

  const bodyText = await response.text();
  const data = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    const message = data?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

async function listResumes() {
  return apiRequest('/resumes?sort=name');
}

async function createResume(payload) {
  return apiRequest('/resumes', {
    method: 'POST',
    body: JSON.stringify({ ...payload, withSampleData: false }),
  });
}

async function updateResume(id, payload) {
  return apiRequest(`/resumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

function buildDirectJsonContext(jsonPath) {
  const jsonRaw = readFileSync(jsonPath, 'utf8');
  const json = JSON.parse(jsonRaw);
  const fileName = basename(jsonPath, '.json');
  const reportNum = fileName.match(/^(\d+)-/)?.[1] || '';
  return {
    reportPath: '',
    reportMeta: {
      reportNum,
      company: '',
      role: fileName.replace(/^\d+-/, ''),
      artifactPath: jsonPath,
    },
    resumeData: json,
    jsonPath,
  };
}

function resolveTargetContext(target) {
  const absolute = resolve(target);

  if (existsSync(absolute) && absolute.endsWith('.json')) {
    return buildDirectJsonContext(absolute);
  }

  const reportPath = resolveReportPath(target);
  const reportRaw = readFileSync(reportPath, 'utf8');
  const reportMeta = parseReportMeta(reportPath, reportRaw);
  const jsonPath = findBestArtifact(reportMeta);
  const jsonRaw = readFileSync(jsonPath, 'utf8');

  return {
    reportPath,
    reportMeta,
    resumeData: JSON.parse(jsonRaw),
    jsonPath,
  };
}

async function main() {
  const { target, dryRun } = parseArgs(process.argv);
  const context = resolveTargetContext(target);
  validateResumeArtifact(context.jsonPath);

  const candidateName = context.resumeData?.basics?.name || 'Resume';
  const rolesByCompany = collectCompanyRoles();
  const name = buildResumeName(candidateName, context.reportMeta, rolesByCompany);
  const slug = buildResumeSlug(candidateName, context.reportMeta);
  const tags = buildTags(context.reportMeta);
  const resumes = await listResumes();
  const existing = resumes.find((resume) => resume.slug === slug);

  const summary = {
    action: existing ? 'update' : 'create',
    dryRun,
    id: existing?.id || null,
    name,
    slug,
    tags,
    reportPath: context.reportPath || null,
    jsonPath: context.jsonPath,
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (existing?.isLocked) {
    throw new Error(`Resume \"${existing.name}\" is locked in RxResume; unlock it before syncing.`);
  }

  let id = existing?.id;
  if (!id) {
    id = await createResume({ name, slug, tags });
  }

  const updated = await updateResume(id, {
    name,
    slug,
    tags,
    data: context.resumeData,
    isPublic: existing?.isPublic ?? false,
  });

  console.log(JSON.stringify({
    ...summary,
    dryRun: false,
    id: updated.id,
    updatedAt: updated.updatedAt,
  }, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
