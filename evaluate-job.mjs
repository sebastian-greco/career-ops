#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(__filename);

const args = process.argv.slice(2);
let jdFile = '';
let metaFile = '';
let outputJsonOnly = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--jd-file' && args[i + 1]) {
    jdFile = args[++i];
  } else if (arg === '--meta-file' && args[i + 1]) {
    metaFile = args[++i];
  } else if (arg === '--json') {
    outputJsonOnly = true;
  }
}

if (!jdFile || !metaFile) {
  console.error('Usage: node evaluate-job.mjs --jd-file <path> --meta-file <path> [--json]');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is required for evaluate-job.mjs');
  process.exit(1);
}

const modelName = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

function readRequired(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8').trim();
}

function readArgFile(filePath) {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing file: ${absolutePath}`);
  }
  return readFileSync(absolutePath, 'utf8').trim();
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n * 10) / 10));
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
}

function safeSkillRows(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => ({
    skill: String(row?.skill || '').trim(),
    evidence: String(row?.evidence || '').trim(),
    jobDescription: String(row?.jobDescription || '').trim(),
    notes: String(row?.notes || '').trim(),
  })).filter((row) => row.skill && row.jobDescription).slice(0, 8);
}

function safeLegitimacy(value) {
  return ['High Confidence', 'Proceed with Caution', 'Suspicious'].includes(value)
    ? value
    : 'Proceed with Caution';
}

function safeRecommendation(value, global) {
  // A hard eligibility gate (location, authorization, etc.) may explicitly
  // return SKIP even when skill-fit dimensions would otherwise average >= 4.
  // Never coerce that terminal judgment back into APPLY.
  if (String(value || '').trim().toUpperCase() === 'SKIP') return 'SKIP';
  if (global >= 4.0) return 'APPLY';
  if (global >= 3.5) return 'CONSIDER';
  return 'SKIP';
}

function coerceEvaluation(raw) {
  const scores = {
    cvMatch: clampScore(raw?.scores?.cvMatch) ?? 3.0,
    northStar: clampScore(raw?.scores?.northStar) ?? 3.0,
    comp: clampScore(raw?.scores?.comp) ?? 3.0,
    culture: clampScore(raw?.scores?.culture) ?? 3.0,
    redFlags: clampScore(raw?.scores?.redFlags) ?? 3.0,
  };

  const weighted = (scores.cvMatch * 0.30)
    + (scores.northStar * 0.30)
    + (scores.comp * 0.15)
    + (scores.culture * 0.15)
    + (scores.redFlags * 0.10);
  scores.global = Math.round(weighted * 10) / 10;

  const recommendation = safeRecommendation(raw?.recommendation, scores.global);
  const concerns = safeArray(raw?.concerns);

  return {
    company: String(raw?.company || 'Unknown Company').trim(),
    role: String(raw?.role || 'Unknown Role').trim(),
    archetype: String(raw?.archetype || 'General Software Engineering').trim(),
    domain: String(raw?.domain || 'Software product engineering').trim(),
    remoteModel: String(raw?.remoteModel || 'Location unclear').trim(),
    legitimacy: safeLegitimacy(raw?.legitimacy),
    summary: String(raw?.summary || '').trim() || (recommendation === 'APPLY'
      ? 'Strong enough to pursue, especially if compensation and remote details hold up in recruiter screening.'
      : recommendation === 'CONSIDER'
        ? 'Interesting on paper, but one or two practical fit issues keep it below the priority tier.'
        : 'Better to skip: the title or domain may look interesting, but the actual fit breaks against location, culture, or role-family constraints.'),
    strengths: safeArray(raw?.strengths).slice(0, 5),
    concerns: concerns.slice(0, 5),
    hardSkills: safeSkillRows(raw?.hardSkills),
    softSkills: safeSkillRows(raw?.softSkills),
    fitNotes: {
      cvMatch: String(raw?.fitNotes?.cvMatch || 'Evidence-backed overlap with the JD.').trim(),
      northStar: String(raw?.fitNotes?.northStar || 'Assessed against the leadership-first target path.').trim(),
      comp: String(raw?.fitNotes?.comp || 'Compensation judgment based on posted or researched data.').trim(),
      culture: String(raw?.fitNotes?.culture || 'Cultural signals weighted for sustainability and remote maturity.').trim(),
      redFlags: String(raw?.fitNotes?.redFlags || 'Real blockers or risk signals that could derail fit.').trim(),
    },
    legitimacySignals: Array.isArray(raw?.legitimacySignals)
      ? raw.legitimacySignals.map((signal) => ({
          signal: String(signal?.signal || 'Signal').trim(),
          finding: String(signal?.finding || 'Not specified').trim(),
          weight: ['Positive', 'Neutral', 'Concerning'].includes(signal?.weight) ? signal.weight : 'Neutral',
        })).slice(0, 6)
      : [],
    keywords: safeArray(raw?.keywords).slice(0, 20),
    scores,
    recommendation,
    trackerStatus: recommendation === 'SKIP' ? 'SKIP' : 'Evaluated',
    compensation: raw?.compensation ? String(raw.compensation).trim() : 'Not visible in posting',
    note: String(raw?.note || `${recommendation} - ${concerns[0] || 'See report.'}`).trim(),
  };
}

const sharedContext = readRequired('modes/_shared.md');
const profileContext = readRequired('modes/_profile.md');
const rubricContext = readRequired('modes/_evaluation-rubric.md');
const schemaContext = readRequired('modes/_evaluation-schema.md');
const offerMode = readRequired('modes/oferta.md');
const cvContent = readRequired('cv.md');
const profileYml = readRequired('config/profile.yml');
const articleDigest = existsSync(join(ROOT, 'article-digest.md')) ? readRequired('article-digest.md') : '[article-digest.md missing]';
const jdContent = readArgFile(jdFile);
const metaContent = readArgFile(metaFile);

const systemPrompt = `You are career-ops, a job evaluation assistant.

Your job is to evaluate one job description using one standardized methodology only.

You must follow these documents exactly:

===== SHARED CONTEXT =====
${sharedContext}

===== USER PROFILE =====
${profileContext}

===== SHARED EVALUATION RUBRIC =====
${rubricContext}

===== SHARED EVALUATION SCHEMA =====
${schemaContext}

===== OFFER MODE =====
${offerMode}

===== CV =====
${cvContent}

===== PROFILE YAML =====
${profileYml}

===== ARTICLE DIGEST =====
${articleDigest}

Rules:
1. Final scoring must be agentic and follow the shared rubric.
2. Use the extracted meta facts as hard evidence, but do not let heuristic labels override your judgment.
3. Return valid JSON only.
4. Do not wrap the JSON in markdown fences.
5. Keep strengths and concerns concise, specific, and evidence-backed.
6. The global score must respect the shared weighted formula.
7. Use recommendation thresholds from the shared rubric.
8. Apply the user's location eligibility policy before weighting fit. For an explicit hard location blocker, return SKIP even if skill-match dimensions are high.
`;

const userPrompt = `Evaluate this job.

===== EXTRACTED META FACTS =====
${metaContent}

===== JOB DESCRIPTION =====
${jdContent}
`;

function parseModelJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model response did not contain a JSON object');
  }
}

async function generateEvaluationJson(prompt) {
  const result = await model.generateContent([
    { text: systemPrompt },
    { text: prompt },
  ]);
  return parseModelJson(result.response.text());
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        role: { type: 'string' },
        archetype: { type: 'string' },
        domain: { type: 'string' },
        remoteModel: { type: 'string' },
        legitimacy: { type: 'string', enum: ['High Confidence', 'Proceed with Caution', 'Suspicious'] },
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        hardSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              evidence: { type: 'string' },
              jobDescription: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['skill', 'evidence', 'jobDescription', 'notes'],
          },
        },
        softSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              evidence: { type: 'string' },
              jobDescription: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['skill', 'evidence', 'jobDescription', 'notes'],
          },
        },
        fitNotes: {
          type: 'object',
          properties: {
            cvMatch: { type: 'string' },
            northStar: { type: 'string' },
            comp: { type: 'string' },
            culture: { type: 'string' },
            redFlags: { type: 'string' },
          },
          required: ['cvMatch', 'northStar', 'comp', 'culture', 'redFlags'],
        },
        legitimacySignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              finding: { type: 'string' },
              weight: { type: 'string', enum: ['Positive', 'Neutral', 'Concerning'] },
            },
            required: ['signal', 'finding', 'weight'],
          },
        },
        keywords: { type: 'array', items: { type: 'string' } },
        scores: {
          type: 'object',
          properties: {
            cvMatch: { type: 'number' },
            northStar: { type: 'number' },
            comp: { type: 'number' },
            culture: { type: 'number' },
            redFlags: { type: 'number' },
            global: { type: 'number' },
          },
          required: ['cvMatch', 'northStar', 'comp', 'culture', 'redFlags', 'global'],
        },
        recommendation: { type: 'string', enum: ['APPLY', 'CONSIDER', 'SKIP'] },
        compensation: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['company', 'role', 'archetype', 'domain', 'remoteModel', 'legitimacy', 'summary', 'strengths', 'concerns', 'hardSkills', 'softSkills', 'fitNotes', 'legitimacySignals', 'keywords', 'scores', 'recommendation', 'compensation', 'note'],
    },
  },
});

let parsed;
try {
  parsed = await generateEvaluationJson(userPrompt);
} catch (error) {
  try {
    parsed = await generateEvaluationJson(`${userPrompt}\n\nYour previous response was invalid JSON. Return one valid JSON object only. Use double quotes for every string, no markdown, no comments, no trailing commas, and no prose outside JSON.`);
  } catch (retryError) {
    console.error(`Failed to evaluate job: ${retryError.message}`);
    process.exit(1);
  }
}

const evaluation = coerceEvaluation(parsed);

if (outputJsonOnly) {
  process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
}
