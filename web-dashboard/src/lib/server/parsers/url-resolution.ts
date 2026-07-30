import fs from "node:fs/promises";
import path from "node:path";

import type { DashboardApplication } from "@/lib/dashboard/types";

interface BatchEntry {
  id: string;
  url: string;
  company: string;
  role: string;
}

export interface ReportUrlHints {
  url: string;
  batchId: string;
}

interface ScanHistoryCache {
  filePath: string | null;
  modifiedAtMs: number;
  size: number;
  indexedCompanyKeys: Set<string>;
  candidatesByCompany: Map<string, Array<{ role: string; url: string }>>;
}

const scanHistoryCaches = new Map<string, ScanHistoryCache>();

const reportUrlRegex = /^\*\*URL:\*\*\s*(https?:\/\/\S+)/m;
const batchIdRegex = /^\*\*Batch ID:\*\*\s*(\d+)/m;

function normalizeCompany(value: string) {
  let normalized = value.trim().toLowerCase();
  for (const suffix of [
    " inc.",
    " inc",
    " llc",
    " ltd",
    " corp",
    " corporation",
    " technologies",
    " technology",
    " group",
    " co.",
  ]) {
    normalized = normalized.replace(new RegExp(`${suffix}$`), "");
  }

  return normalized.trim();
}

function bestRoleUrl(targetRole: string, candidates: Array<{ role: string; url: string }>) {
  const loweredTarget = targetRole.toLowerCase();
  let best = candidates[0]?.url ?? "";
  let bestScore = -1;

  for (const candidate of candidates) {
    let score = 0;
    const loweredRole = candidate.role.toLowerCase();
    for (const word of loweredTarget.split(/\s+/)) {
      if (word.length > 2 && loweredRole.includes(word)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate.url;
    }
  }

  return best;
}

async function readOptional(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export function extractReportHints(raw: string): ReportUrlHints {
  return {
    url: raw.match(reportUrlRegex)?.[1] ?? "",
    batchId: raw.match(batchIdRegex)?.[1] ?? "",
  };
}

function parseBatchInput(raw: string) {
  const entries = new Map<string, BatchEntry>();

  for (const line of raw.split(/\r?\n/)) {
    const fields = line.split("\t");
    if (fields.length < 4 || fields[0] === "id") {
      continue;
    }
    const notes = fields[3] ?? "";
    const notesPrefix = notes.includes(" | ") ? notes.slice(0, notes.indexOf(" | ")) : notes;
    const atIndex = notesPrefix.lastIndexOf(" @ ");
    const fallbackUrl = fields[1]?.startsWith("http") ? fields[1] : "";
    const notesUrl = (() => {
      const lastPipe = notes.lastIndexOf("| ");
      if (lastPipe < 0) {
        return "";
      }
      const candidate = notes.slice(lastPipe + 2).trim();
      return candidate.startsWith("http") ? candidate : "";
    })();

    entries.set(fields[0], {
      id: fields[0],
      url: notesUrl || fallbackUrl,
      company: atIndex >= 0 ? notesPrefix.slice(atIndex + 3).trim() : "",
      role: atIndex >= 0 ? notesPrefix.slice(0, atIndex).trim() : "",
    });
  }

  return entries;
}

function parseBatchState(raw: string, batchInput: Map<string, BatchEntry>) {
  const reportUrlMap = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const fields = line.split("\t");
    if (fields.length < 6 || fields[0] === "id") {
      continue;
    }
    const [id, , status, , , reportNumber] = fields;
    if (status !== "completed" || !reportNumber || reportNumber === "-") {
      continue;
    }
    const entry = batchInput.get(id);
    if (!entry?.url) {
      continue;
    }
    reportUrlMap.set(reportNumber, entry.url);
    if (reportNumber.length < 3) {
      reportUrlMap.set(reportNumber.padStart(3, "0"), entry.url);
    }
  }
  return reportUrlMap;
}

function parseScanHistory(raw: string, requestedCompanyKeys: ReadonlySet<string>) {
  const byCompany = new Map<string, Array<{ role: string; url: string }>>();
  for (const line of raw.split(/\r?\n/)) {
    const fields = line.split("\t");
    if (fields.length < 5 || fields[0] === "url") {
      continue;
    }
    const [url, , , title, company] = fields;
    if (!url?.startsWith("http")) {
      continue;
    }
    const key = normalizeCompany(company);
    if (!requestedCompanyKeys.has(key)) {
      continue;
    }
    const current = byCompany.get(key) ?? [];
    current.push({ role: title, url });
    byCompany.set(key, current);
  }
  return byCompany;
}

async function findScanHistoryFile(careerOpsRoot: string) {
  for (const filePath of [
    path.join(careerOpsRoot, "scan-history.tsv"),
    path.join(careerOpsRoot, "data", "scan-history.tsv"),
  ]) {
    try {
      return { filePath, stat: await fs.stat(filePath) };
    } catch {
      continue;
    }
  }

  return null;
}

async function getScanHistoryCandidates(careerOpsRoot: string, requestedCompanyKeys: ReadonlySet<string>) {
  const source = await findScanHistoryFile(careerOpsRoot);
  const cached = scanHistoryCaches.get(careerOpsRoot);
  const cacheIsCurrent =
    cached &&
    cached.filePath === source?.filePath &&
    cached.modifiedAtMs === (source?.stat.mtimeMs ?? 0) &&
    cached.size === (source?.stat.size ?? 0);
  let cache: ScanHistoryCache;
  if (cacheIsCurrent && cached) {
    cache = cached;
  } else {
    cache = {
      filePath: source?.filePath ?? null,
      modifiedAtMs: source?.stat.mtimeMs ?? 0,
      size: source?.stat.size ?? 0,
      indexedCompanyKeys: new Set<string>(),
      candidatesByCompany: new Map<string, Array<{ role: string; url: string }>>(),
    };
    scanHistoryCaches.set(careerOpsRoot, cache);
  }

  const missingCompanyKeys = new Set(
    [...requestedCompanyKeys].filter((companyKey) => !cache.indexedCompanyKeys.has(companyKey)),
  );
  if (source && missingCompanyKeys.size > 0) {
    const extracted = parseScanHistory(await fs.readFile(source.filePath, "utf8"), missingCompanyKeys);
    for (const companyKey of missingCompanyKeys) {
      cache.indexedCompanyKeys.add(companyKey);
      cache.candidatesByCompany.set(companyKey, extracted.get(companyKey) ?? []);
    }
  } else if (!source) {
    for (const companyKey of missingCompanyKeys) {
      cache.indexedCompanyKeys.add(companyKey);
    }
  }

  return cache.candidatesByCompany;
}

export async function enrichApplicationUrls(
  careerOpsRoot: string,
  applications: DashboardApplication[],
  reportHintsByPath: ReadonlyMap<string, ReportUrlHints> = new Map<string, ReportUrlHints>(),
  { includeScanHistory = true }: { includeScanHistory?: boolean } = {},
) {
  const batchInput = parseBatchInput(
    await readOptional(path.join(careerOpsRoot, "batch", "batch-input.tsv")),
  );
  const reportStateMap = parseBatchState(
    await readOptional(path.join(careerOpsRoot, "batch", "batch-state.tsv")),
    batchInput,
  );
  const byCompany = new Map<string, Array<{ role: string; url: string }>>();
  for (const entry of batchInput.values()) {
    if (!entry.url || !entry.company) {
      continue;
    }
    const key = normalizeCompany(entry.company);
    const current = byCompany.get(key) ?? [];
    current.push({ role: entry.role, url: entry.url });
    byCompany.set(key, current);
  }

  const unresolvedApplications: DashboardApplication[] = [];
  for (const application of applications) {
    if (application.reportPath) {
      const suppliedHints = reportHintsByPath.get(application.reportPath);
      const hints = suppliedHints ?? extractReportHints(
        (await readOptional(path.join(careerOpsRoot, application.reportPath))).slice(0, 1000),
      );
      if (hints.url) {
        application.jobUrl = hints.url;
        continue;
      }
      if (hints.batchId && batchInput.get(hints.batchId)?.url) {
        application.jobUrl = batchInput.get(hints.batchId)?.url ?? "";
        continue;
      }
    }

    if (application.reportNumber && reportStateMap.has(application.reportNumber)) {
      application.jobUrl = reportStateMap.get(application.reportNumber) ?? "";
      continue;
    }

    unresolvedApplications.push(application);
  }

  const scanHistory = includeScanHistory
    ? await getScanHistoryCandidates(
        careerOpsRoot,
        new Set(unresolvedApplications.map((application) => normalizeCompany(application.company))),
      )
    : new Map<string, Array<{ role: string; url: string }>>();

  for (const application of unresolvedApplications) {
    const companyKey = normalizeCompany(application.company);
    const scanMatches = scanHistory.get(companyKey) ?? [];
    if (!application.jobUrl && scanMatches.length > 0) {
      application.jobUrl = bestRoleUrl(application.role, scanMatches);
    }

    const batchMatches = byCompany.get(companyKey) ?? [];
    if (!application.jobUrl && batchMatches.length > 0) {
      application.jobUrl = bestRoleUrl(application.role, batchMatches);
    }
  }

  return applications;
}
