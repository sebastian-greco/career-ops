#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TONE = 'confident';
const DEFAULT_LENGTH = 'standard';
const PIPELINE_STAGES = new Set(['draft', 'applied', 'interviewing', 'offer', 'rejected', 'declined']);

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

function usage() {
  console.log(`Usage:
  node sync-application-tracker.mjs upsert --input <json-file>
  node sync-application-tracker.mjs search --query <text>
  node sync-application-tracker.mjs status --id <application-id> --stage <draft|applied|interviewing|offer|rejected|declined> [--date YYYY-MM-DD]

Environment:
  APPLICATION_TRACKER_URL   Base URL for the NextStage tracker API (example: http://localhost:3002)
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const command = args[0];
  const options = {};
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : 'true';
    options[key] = value;
    if (value !== 'true') index += 1;
  }

  return { command, options };
}

function requireBaseUrl() {
  const baseUrl = process.env.APPLICATION_TRACKER_URL;
  if (!baseUrl) {
    throw new Error('Missing APPLICATION_TRACKER_URL');
  }
  return baseUrl.replace(/\/$/, '');
}

async function apiRequest(pathname, init = {}) {
  const response = await fetch(`${requireBaseUrl()}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const bodyText = await response.text();
  const data = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    const message = data?.error || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
}

function questionFingerprint(question) {
  return createHash('sha1').update(normalizeText(question)).digest('hex').slice(0, 12);
}

function readJsonInput(inputPath) {
  const absolutePath = resolve(inputPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Input file not found: ${absolutePath}`);
  }

  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function ensurePipelineStatus(input) {
  if (input.pipelineStatus) return input.pipelineStatus;
  if (input.pipelineStage) {
    return {
      stage: input.pipelineStage,
      effectiveDate: input.pipelineEffectiveDate || todayString(),
    };
  }
  return {
    stage: 'draft',
    effectiveDate: todayString(),
  };
}

function isQuestionDefinitelyNotMemory(entry) {
  const question = normalizeText(entry.question);
  if (!question) return true;

  const patterns = [
    /\b(full )?name\b/,
    /\bemail\b/,
    /\bphone\b/,
    /\bmobile\b/,
    /\blocation\b/,
    /\bcity\b/,
    /\bcountry\b/,
    /\baddress\b/,
    /\blinkedin\b/,
    /\bgithub\b/,
    /\bportfolio\b/,
    /\bwebsite\b/,
    /\bwork authorization\b/,
    /\bvisa\b/,
    /\bpronouns\b/,
    /\bdate of birth\b/,
    /\bgender\b/,
    /\brace\b/,
    /\bethnicity\b/,
    /\bdisability\b/,
    /\bveteran\b/,
    /\bcheckbox\b/,
    /\backnowledg/,
  ];

  return patterns.some((pattern) => pattern.test(question));
}

function shouldPersistQuestion(entry) {
  if (!entry || !entry.question || !entry.answer) return false;
  if (entry.savePolicy === 'skip') return false;
  if (entry.savePolicy === 'store') return true;
  const question = normalizeText(entry.question);
  const answer = normalizeText(entry.answer);
  if (/\b(salary|compensation|comp|expected salary|salary expectation|salary expectations)\b/.test(question)) {
    return true;
  }
  if (/(why this role|why this company|leadership philosophy|ai workflow|ai tooling|coding assistants|payment service providers|psps|acquirers|payment gateways|payments integrations|role fit|managing software engineering teams|hiring coaching performance reviews|management experience)/.test(question)) {
    return true;
  }
  if (/(additional information|anything more you d like to tell us|anything else you d like to share|anything else you want us to know|anything else)/.test(question)) {
    return answer.length >= 180;
  }
  if (isQuestionDefinitelyNotMemory(entry)) return false;
  return false;
}

function toSavedQuestionAnswers(inputQuestions) {
  const persisted = [];
  const seen = new Map();

  for (const entry of inputQuestions || []) {
    if (!shouldPersistQuestion(entry)) continue;
    const baseId = entry.id || `qa-${questionFingerprint(entry.question)}`;
    const count = seen.get(baseId) || 0;
    seen.set(baseId, count + 1);
    const entryId = count === 0 ? baseId : `${baseId}-${count + 1}`;
    persisted.push({
      id: entryId,
      question: entry.question.trim(),
      answer: entry.answer.trim(),
      includeInAiContext: entry.includeInAiContext === true,
    });
  }

  return persisted;
}

function desiredQuestionAnswerIds(inputQuestions) {
  return new Set(toSavedQuestionAnswers(inputQuestions).map((entry) => entry.id));
}

function buildCompanyNotes(input) {
  if (typeof input.companyNotes === 'string') {
    return input.companyNotes.trim();
  }

  const notes = [];
  if (input.reportId) notes.push(`career-ops report #${input.reportId}`);
  if (input.reportPath) notes.push(`report: ${input.reportPath}`);
  if (input.source === 'apply') notes.push('created from apply mode');
  if (input.fitNotes) notes.push(input.fitNotes.trim());
  return notes.filter(Boolean).join(' | ');
}

function validateUpsertInput(input) {
  if (!input.companyName || String(input.companyName).trim().length < 2) {
    throw new Error('companyName is required');
  }
  if (!input.roleTitle || String(input.roleTitle).trim().length < 2) {
    throw new Error('roleTitle is required');
  }
  if (!input.jobDescriptionText || String(input.jobDescriptionText).trim().length < 80) {
    throw new Error('jobDescriptionText is required and should be the extracted live JD');
  }

  const pipelineStatus = ensurePipelineStatus(input);
  if (!PIPELINE_STAGES.has(pipelineStatus.stage)) {
    throw new Error(`Invalid pipeline stage: ${pipelineStatus.stage}`);
  }

  return pipelineStatus;
}

function findMatchingApplication(applications, input) {
  const targetUrl = String(input.jobPostingUrl || '').trim();
  if (targetUrl) {
    const exactUrlMatch = applications.find((application) => application.jobPostingUrl === targetUrl);
    if (exactUrlMatch) {
      return { application: exactUrlMatch, matchedBy: 'jobPostingUrl' };
    }
  }

  const normalizedCompany = normalizeText(input.companyName);
  const normalizedRole = normalizeText(input.roleTitle);
  const companyRoleMatch = applications.find((application) => {
    return normalizeText(application.companyName) === normalizedCompany
      && normalizeText(application.roleTitle) === normalizedRole;
  });

  if (companyRoleMatch) {
    return { application: companyRoleMatch, matchedBy: 'companyRole' };
  }

  return { application: null, matchedBy: 'new' };
}

async function getWorkspaceSnapshot() {
  return apiRequest('/api/applications');
}

async function createApplication(payload) {
  return apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateApplication(id, payload) {
  return apiRequest(`/api/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function upsertQuestionAnswer(applicationId, entry) {
  return apiRequest(`/api/applications/${applicationId}/question-answers/${entry.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      question: entry.question,
      answer: entry.answer,
      includeInAiContext: entry.includeInAiContext,
    }),
  });
}

async function deleteQuestionAnswer(applicationId, entryId) {
  return apiRequest(`/api/applications/${applicationId}/question-answers/${entryId}`, {
    method: 'DELETE',
  });
}

async function searchQuestions(query) {
  const searchParams = new URLSearchParams();
  if (query) searchParams.set('q', query);
  return apiRequest(`/api/questions?${searchParams.toString()}`);
}

async function handleUpsert(options) {
  if (!options.input) {
    throw new Error('Missing --input <json-file>');
  }

  const input = readJsonInput(options.input);
  const pipelineStatus = validateUpsertInput(input);
  const workspace = await getWorkspaceSnapshot();
  const defaultResume = workspace.resumes.find((resume) => resume.isDefault) || workspace.resumes[0];

  if (!defaultResume) {
    throw new Error('The application tracker has no default resume to attach');
  }

  const { application: existingApplication, matchedBy } = findMatchingApplication(workspace.applications, input);
  const basePayload = {
    companyName: input.companyName.trim(),
    roleTitle: input.roleTitle.trim(),
    jobPostingUrl: String(input.jobPostingUrl || '').trim(),
    jobDescriptionText: input.jobDescriptionText.trim(),
    companyNotes: buildCompanyNotes(input),
    tone: input.tone || DEFAULT_TONE,
    length: input.length || DEFAULT_LENGTH,
    resumeVersionId: defaultResume.id,
  };

  let application;
  let action;

  if (existingApplication) {
    const response = await updateApplication(existingApplication.id, {
      ...basePayload,
      currentDraft: input.hasCoverLetterField
        ? (typeof input.coverLetter === 'string' ? input.coverLetter : input.currentDraft)
        : '',
      pipelineStatus,
    });
    application = response.application;
    action = 'updated';
  } else {
    const created = await createApplication(basePayload);
    const updated = await updateApplication(created.application.id, {
      currentDraft: input.hasCoverLetterField
        ? (typeof input.coverLetter === 'string' ? input.coverLetter : input.currentDraft)
        : '',
      pipelineStatus,
    });
    application = updated.application;
    action = 'created';
  }

  const savedQuestionAnswers = toSavedQuestionAnswers(input.questions);
  const desiredIds = desiredQuestionAnswerIds(input.questions);
  const staleEntries = (application.savedQuestionAnswers || []).filter((entry) => !desiredIds.has(entry.id));

  for (const entry of staleEntries) {
    await deleteQuestionAnswer(application.id, entry.id);
  }

  for (const entry of savedQuestionAnswers) {
    await upsertQuestionAnswer(application.id, entry);
  }

  const refreshed = await apiRequest(`/api/applications/${application.id}`);
  console.log(JSON.stringify({
    action,
    matchedBy,
    applicationId: refreshed.application.id,
    companyName: refreshed.application.companyName,
    roleTitle: refreshed.application.roleTitle,
    jobPostingUrl: refreshed.application.jobPostingUrl,
    pipelineStatus: refreshed.application.pipelineStatus,
    savedQuestionAnswerCount: refreshed.application.savedQuestionAnswers.length,
    persistedQuestionCount: savedQuestionAnswers.length,
    skippedQuestionCount: (input.questions || []).length - savedQuestionAnswers.length,
  }, null, 2));
}

async function handleSearch(options) {
  if (!options.query) {
    throw new Error('Missing --query <text>');
  }
  const result = await searchQuestions(options.query);
  console.log(JSON.stringify(result, null, 2));
}

async function handleStatus(options) {
  if (!options.id) {
    throw new Error('Missing --id <application-id>');
  }
  if (!options.stage || !PIPELINE_STAGES.has(options.stage)) {
    throw new Error('Missing or invalid --stage');
  }

  const effectiveDate = options.date || todayString();
  const response = await updateApplication(options.id, {
    pipelineStatus: {
      stage: options.stage,
      effectiveDate,
    },
  });

  console.log(JSON.stringify({
    applicationId: response.application.id,
    pipelineStatus: response.application.pipelineStatus,
  }, null, 2));
}

const { command, options } = parseArgs(process.argv);

try {
  if (command === 'upsert') {
    await handleUpsert(options);
  } else if (command === 'search') {
    await handleSearch(options);
  } else if (command === 'status') {
    await handleStatus(options);
  } else {
    usage();
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
