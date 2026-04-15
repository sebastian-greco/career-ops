import fs from "node:fs/promises";
import path from "node:path";

import type {
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
import { enrichApplicationUrls } from "@/lib/server/parsers/url-resolution";
import { computePipelineMetrics } from "@/lib/server/metrics/pipeline-metrics";
import { computeProgressMetrics } from "@/lib/server/metrics/progress-metrics";
import type { CareerOpsRepository } from "@/lib/server/repository/types";

async function readFirstExisting(paths: string[]) {
  for (const filePath of paths) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error(`None of the expected files exist: ${paths.join(", ")}`);
}

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

  async getStatusCatalog(): Promise<StatusOption[]> {
    return loadStatusCatalog(this.careerOpsRoot);
  }

  async getPipelineSnapshot(): Promise<PipelineSnapshot> {
    const statuses = await this.getStatusCatalog();
    const applicationsRaw = await readFirstExisting([
      path.join(this.careerOpsRoot, "applications.md"),
      path.join(this.careerOpsRoot, "data", "applications.md"),
    ]);

    const applications = parseApplicationsMarkdown(applicationsRaw, (status) =>
      normalizeStatus(status, statuses),
    );

    await enrichApplicationUrls(this.careerOpsRoot, applications);

    const summariesByReportId: Record<string, ReportSummary> = {};
    await Promise.all(
      applications.map(async (application) => {
        if (!application.reportPath || !application.reportNumber) {
          return;
        }

        try {
          const raw = await fs.readFile(path.join(this.careerOpsRoot, application.reportPath), "utf8");
          const summary = parseReportSummary(application.reportPath, raw);
          if (!summary.url && application.jobUrl) {
            summary.url = application.jobUrl;
          }
          application.summary = summary;
          summariesByReportId[application.reportNumber] = summary;
        } catch {
          // Keep pipeline resilient when an individual report is missing.
        }
      }),
    );

    return {
      applications,
      metrics: computePipelineMetrics(applications),
      filterCounts: countFilters(applications),
      statuses,
      summariesByReportId,
    };
  }

  async getProgressSnapshot(): Promise<ProgressSnapshot> {
    const snapshot = await this.getPipelineSnapshot();
    return {
      metrics: computeProgressMetrics(snapshot.applications),
    };
  }

  async getReportSummary(reportId: string): Promise<ReportSummary | null> {
    const snapshot = await this.getPipelineSnapshot();
    const application = snapshot.applications.find((app) => app.reportNumber === reportId);
    if (!application?.reportPath) {
      return null;
    }

    const raw = await fs.readFile(path.join(this.careerOpsRoot, application.reportPath), "utf8");
    const summary = parseReportSummary(application.reportPath, raw);
    if (!summary.url && application.jobUrl) {
      summary.url = application.jobUrl;
    }
    return summary;
  }

  async getReportDocument(reportId: string): Promise<ReportDocument | null> {
    const snapshot = await this.getPipelineSnapshot();
    const application = snapshot.applications.find((app) => app.reportNumber === reportId);
    if (!application?.reportPath) {
      return null;
    }

    const raw = await fs.readFile(path.join(this.careerOpsRoot, application.reportPath), "utf8");
    const document = parseReportDocument(application.reportPath, raw);
    if (!document.url && application.jobUrl) {
      document.url = application.jobUrl;
    }
    return document;
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
