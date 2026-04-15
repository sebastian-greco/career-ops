import { computePipelineMetrics } from "@/lib/server/metrics/pipeline-metrics";
import { computeProgressMetrics } from "@/lib/server/metrics/progress-metrics";
import type { DashboardApplication } from "@/lib/dashboard/types";

const applications: DashboardApplication[] = [
  {
    number: 1,
    date: "2026-04-10",
    company: "DuckDuckGo",
    role: "Engineering Director",
    statusRaw: "Applied",
    statusNormalized: "applied",
    score: 4.7,
    scoreRaw: "4.7/5",
    hasPdf: true,
    reportPath: "reports/001.md",
    reportNumber: "001",
    notes: "Strong fit",
    jobUrl: "https://example.com/1",
  },
  {
    number: 2,
    date: "2026-04-11",
    company: "n8n",
    role: "Engineering Manager",
    statusRaw: "Interview",
    statusNormalized: "interview",
    score: 4.3,
    scoreRaw: "4.3/5",
    hasPdf: true,
    reportPath: "reports/002.md",
    reportNumber: "002",
    notes: "Priority",
    jobUrl: "https://example.com/2",
  },
  {
    number: 3,
    date: "2026-04-12",
    company: "Replit",
    role: "Staff Engineer",
    statusRaw: "SKIP",
    statusNormalized: "skip",
    score: 2.9,
    scoreRaw: "2.9/5",
    hasPdf: false,
    reportPath: "reports/003.md",
    reportNumber: "003",
    notes: "Not a fit",
    jobUrl: "https://example.com/3",
  },
];

describe("metrics", () => {
  it("computes pipeline metrics", () => {
    const metrics = computePipelineMetrics(applications);

    expect(metrics.total).toBe(3);
    expect(metrics.avgScore).toBeCloseTo(3.966, 2);
    expect(metrics.byStatus.applied).toBe(1);
    expect(metrics.byStatus.interview).toBe(1);
    expect(metrics.byStatus.skip).toBe(1);
    expect(metrics.actionable).toBe(2);
  });

  it("computes progress metrics", () => {
    const metrics = computeProgressMetrics(applications);

    expect(metrics.funnelStages[0]?.count).toBe(3);
    expect(metrics.interviewRate).toBeGreaterThan(0);
    expect(metrics.scoreBuckets[0]?.count).toBe(1);
    expect(metrics.totalOffers).toBe(0);
    expect(metrics.activeApps).toBe(2);
    expect(metrics.weeklyActivity).toEqual([{ week: "2026-W15", count: 3 }]);
  });
});
