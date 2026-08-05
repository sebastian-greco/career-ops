import fs from "node:fs/promises";
import path from "node:path";

import type {
  DashboardApplication,
  PipelineSnapshot,
  ProgressSnapshot,
  ReportDocument,
  ReportSummary,
  StatusOption,
} from "@/lib/dashboard/types";
import { countFilters, parseApplicationsMarkdown } from "@/lib/server/parsers/applications";
import { parseReportDocument } from "@/lib/server/parsers/report-document";
import { parseReportSummary } from "@/lib/server/parsers/report-summary";
import { loadStatusCatalog, normalizeStatus } from "@/lib/server/parsers/status-catalog";
import {
  enrichApplicationUrls,
  extractReportHints,
  type ReportUrlHints,
} from "@/lib/server/parsers/url-resolution";
import { computePipelineMetrics } from "@/lib/server/metrics/pipeline-metrics";
import { computeProgressMetrics } from "@/lib/server/metrics/progress-metrics";
import { resolveTrackerReportPath } from "@/lib/server/report-path";
import type { CareerOpsRepository } from "@/lib/server/repository/types";

const REPORT_READ_CONCURRENCY = 24;

interface CachedReport {
  modifiedAtMs: number;
  size: number;
  summary: ReportSummary;
  hints: ReportUrlHints;
}

const reportCache = new Map<string, CachedReport>();

function parseTrackerLine(line: string) {
  if (line.includes("\t")) {
    const trimmed = line.replace(/^\|/, "").trim();
    const fields = trimmed.split("\t").map((field) => field.trim().replace(/^\||\|$/g, "").trim());
    return {
      delimiter: "tab" as const,
      fields,
    };
  }

  return {
    delimiter: "pipe" as const,
    fields: line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((field) => field.trim()),
  };
}

function serializeTrackerLine(fields: string[], delimiter: "pipe" | "tab") {
  if (delimiter === "tab") {
    return `| ${fields.join("\t")} |`;
  }

  return `| ${fields.join(" | ")} |`;
}

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function interviewPrepPath(company: string, role: string, availableFileNames: ReadonlySet<string>) {
  const slug = slugifyFileName(`${company} ${role}`);
  if (!slug) {
    return "";
  }

  const fileName = `${slug}.md`;
  return availableFileNames.has(fileName) ? path.posix.join("interview-prep", fileName) : "";
}

function cloneSummary(summary: ReportSummary): ReportSummary {
  return {
    ...summary,
    applicationQuestions: [...summary.applicationQuestions],
  };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex]!);
      }
    }),
  );

  return results;
}

export class FsCareerOpsRepository implements CareerOpsRepository {
  constructor(private readonly careerOpsRoot: string) {}

  private async getApplicationsFilePath() {
    const rootPath = path.join(this.careerOpsRoot, "applications.md");
    const dataPath = path.join(this.careerOpsRoot, "data", "applications.md");
    try {
      await fs.access(rootPath);
      return rootPath;
    } catch {
      return dataPath;
    }
  }

  private async readApplications() {
    const [statuses, applicationsFilePath] = await Promise.all([
      this.getStatusCatalog(),
      this.getApplicationsFilePath(),
    ]);
    const applicationsRaw = await fs.readFile(applicationsFilePath, "utf8");
    const applications = parseApplicationsMarkdown(applicationsRaw, (status) => normalizeStatus(status, statuses));

    await Promise.all(
      applications.map(async (application) => {
        if (!application.reportPath) {
          return;
        }

        application.reportPath = await resolveTrackerReportPath(
          this.careerOpsRoot,
          applicationsFilePath,
          application.reportPath,
        );
      }),
    );

    return {
      statuses,
      applications,
    };
  }

  private async readCachedReport(reportPath: string): Promise<CachedReport | null> {
    const absolutePath = path.join(this.careerOpsRoot, reportPath);
    const cacheKey = `${this.careerOpsRoot}\0${reportPath}`;

    try {
      const stat = await fs.stat(absolutePath);
      const cached = reportCache.get(cacheKey);
      if (cached && cached.modifiedAtMs === stat.mtimeMs && cached.size === stat.size) {
        return cached;
      }

      const raw = await fs.readFile(absolutePath, "utf8");
      const parsed = {
        modifiedAtMs: stat.mtimeMs,
        size: stat.size,
        summary: parseReportSummary(reportPath, raw),
        hints: extractReportHints(raw.slice(0, 1000)),
      };
      reportCache.set(cacheKey, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  private async getReportMetadata(applications: DashboardApplication[]) {
    const entries = await mapWithConcurrency(applications, REPORT_READ_CONCURRENCY, async (application) => {
      if (!application.reportPath || !application.reportNumber) {
        return null;
      }

      const report = await this.readCachedReport(application.reportPath);
      return report ? ([application.reportPath, report] as const) : null;
    });

    return new Map(entries.filter((entry): entry is readonly [string, CachedReport] => entry !== null));
  }

  private async getInterviewPrepFileNames() {
    try {
      return new Set(await fs.readdir(path.join(this.careerOpsRoot, "interview-prep")));
    } catch {
      return new Set<string>();
    }
  }

  private async getApplicationByReportId(reportId: string) {
    const { applications } = await this.readApplications();
    return applications.find((application) => application.reportNumber === reportId) ?? null;
  }

  private async getSingleReportSummary(reportId: string) {
    const application = await this.getApplicationByReportId(reportId);
    if (!application?.reportPath) {
      return null;
    }

    const report = await this.readCachedReport(application.reportPath);
    if (!report) {
      return null;
    }

    await enrichApplicationUrls(
      this.careerOpsRoot,
      [application],
      new Map([[application.reportPath, report.hints]]),
    );

    const summary = cloneSummary(report.summary);
    if (!summary.url && application.jobUrl) {
      summary.url = application.jobUrl;
    }
    summary.interviewPrepPath = interviewPrepPath(
      application.company,
      application.role,
      await this.getInterviewPrepFileNames(),
    );

    return { application, summary };
  }

  async getStatusCatalog(): Promise<StatusOption[]> {
    return loadStatusCatalog(this.careerOpsRoot);
  }

  async getPipelineApplications(): Promise<DashboardApplication[]> {
    return (await this.readApplications()).applications;
  }

  async getPipelineSnapshot(): Promise<PipelineSnapshot> {
    const { statuses, applications } = await this.readApplications();
    const reportMetadata = await this.getReportMetadata(applications);
    const reportHintsByPath = new Map<string, ReportUrlHints>();

    for (const [reportPath, report] of reportMetadata) {
      reportHintsByPath.set(reportPath, report.hints);
    }

    await enrichApplicationUrls(this.careerOpsRoot, applications, reportHintsByPath, { includeScanHistory: false });

    for (const application of applications) {
      const report = reportMetadata.get(application.reportPath);
      if (!report) {
        continue;
      }

      application.compEstimate = report.summary.compEstimate;
      // The table only needs compensation; report details are loaded on demand.
      // Keeping summaries out of every row avoids serializing them twice.
    }

    return {
      applications,
      metrics: computePipelineMetrics(applications),
      filterCounts: countFilters(applications),
      statuses,
    };
  }

  async getProgressSnapshot(): Promise<ProgressSnapshot> {
    const { applications } = await this.readApplications();
    return {
      metrics: computeProgressMetrics(applications),
    };
  }

  async getReportSummary(reportId: string): Promise<ReportSummary | null> {
    return (await this.getSingleReportSummary(reportId))?.summary ?? null;
  }

  async getReportDocument(reportId: string): Promise<ReportDocument | null> {
    const entry = await this.getSingleReportSummary(reportId);
    if (!entry) {
      return null;
    }

    try {
      const raw = await fs.readFile(path.join(this.careerOpsRoot, entry.application.reportPath), "utf8");
      const document = parseReportDocument(entry.application.reportPath, raw);
      if (!document.url && entry.application.jobUrl) {
        document.url = entry.application.jobUrl;
      }
      document.interviewPrepPath = entry.summary.interviewPrepPath;
      return document;
    } catch {
      return null;
    }
  }

  async updateApplicationStatus(reportId: string, newStatus: string): Promise<void> {
    const statuses = await this.getStatusCatalog();
    const normalized = normalizeStatus(newStatus, statuses);
    if (!statuses.some((status) => status.id === normalized)) {
      throw new Error(`Unsupported status: ${newStatus}`);
    }

    const filePath = await this.getApplicationsFilePath();
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    let updated = false;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]?.trim();
      if (!line?.startsWith("|") || !line.includes(`[${reportId}]`)) {
        continue;
      }

      const parsed = parseTrackerLine(line);
      const fields = parsed.fields;
      if (fields.length < 8) {
        continue;
      }
      fields[5] = newStatus;
      lines[index] = serializeTrackerLine(fields, parsed.delimiter);
      updated = true;
      break;
    }

    if (!updated) {
      throw new Error(`Could not find report ${reportId} in tracker`);
    }

    await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
  }
}
