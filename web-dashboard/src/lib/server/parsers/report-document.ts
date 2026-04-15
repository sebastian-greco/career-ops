import type { ReportDocument } from "@/lib/dashboard/types";
import { parseReportSummary } from "@/lib/server/parsers/report-summary";

export function parseReportDocument(reportPath: string, raw: string): ReportDocument {
  return {
    ...parseReportSummary(reportPath, raw),
    markdown: raw,
  };
}
