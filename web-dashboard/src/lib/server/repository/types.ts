import type {
  DashboardApplication,
  PipelineSnapshot,
  ProgressSnapshot,
  ReportDocument,
  ReportSummary,
  StatusOption,
} from "@/lib/dashboard/types";

export interface CareerOpsRepository {
  getPipelineApplications(): Promise<DashboardApplication[]>;
  getPipelineSnapshot(): Promise<PipelineSnapshot>;
  getProgressSnapshot(): Promise<ProgressSnapshot>;
  getReportSummary(reportId: string): Promise<ReportSummary | null>;
  getReportDocument(reportId: string): Promise<ReportDocument | null>;
  updateApplicationStatus(reportId: string, newStatus: string): Promise<void>;
  getStatusCatalog(): Promise<StatusOption[]>;
}
