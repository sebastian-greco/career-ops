export type StatusId =
  | "evaluated"
  | "applied"
  | "responded"
  | "interview"
  | "offer"
  | "rejected"
  | "discarded"
  | "skip";

export type PipelineFilter =
  | "all"
  | "evaluated"
  | "applied"
  | "interview"
  | "rejected"
  | "skip"
  | "top";

export type PipelineSort = "score" | "date" | "company" | "status";

export type PipelineView = "grouped" | "flat";

export interface StatusOption {
  id: StatusId;
  label: string;
  aliases: string[];
  description: string;
  dashboardGroup: StatusId;
}

export interface DashboardApplication {
  number: number;
  date: string;
  company: string;
  role: string;
  statusRaw: string;
  statusNormalized: StatusId | string;
  score: number;
  scoreRaw: string;
  hasPdf: boolean;
  reportPath: string;
  reportNumber: string;
  notes: string;
  jobUrl: string;
  summary?: ReportSummary;
}

export interface ReportSummary {
  reportId: string;
  reportPath: string;
  title: string;
  score: number;
  scoreRaw: string;
  archetype: string;
  tldr: string;
  remote: string;
  compEstimate: string;
  url: string;
  legitimacy: string;
  pdf: string;
}

export interface ReportDocument extends ReportSummary {
  markdown: string;
}

export interface PipelineMetrics {
  total: number;
  byStatus: Partial<Record<StatusId, number>>;
  avgScore: number;
  topScore: number;
  withPdf: number;
  actionable: number;
}

export interface FunnelStage {
  label: string;
  count: number;
  pct: number;
}

export interface ScoreBucket {
  label: string;
  count: number;
}

export interface WeekActivity {
  week: string;
  count: number;
}

export interface ProgressMetrics {
  funnelStages: FunnelStage[];
  scoreBuckets: ScoreBucket[];
  weeklyActivity: WeekActivity[];
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgScore: number;
  topScore: number;
  totalOffers: number;
  activeApps: number;
}

export interface PipelineSnapshot {
  applications: DashboardApplication[];
  metrics: PipelineMetrics;
  filterCounts: Record<PipelineFilter, number>;
  statuses: StatusOption[];
  summariesByReportId: Record<string, ReportSummary>;
}

export interface ProgressSnapshot {
  metrics: ProgressMetrics;
}

export interface PipelineQuery {
  filter?: PipelineFilter;
  sort?: PipelineSort;
  view?: PipelineView;
  search?: string;
}
