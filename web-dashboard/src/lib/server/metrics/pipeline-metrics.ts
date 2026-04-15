import type { DashboardApplication, PipelineMetrics } from "@/lib/dashboard/types";

export function computePipelineMetrics(applications: DashboardApplication[]): PipelineMetrics {
  const byStatus = {
    evaluated: 0,
    applied: 0,
    responded: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    discarded: 0,
    skip: 0,
  } as PipelineMetrics["byStatus"];

  let totalScore = 0;
  let scored = 0;
  let topScore = 0;
  let withPdf = 0;
  let actionable = 0;

  for (const application of applications) {
    if (application.statusNormalized in byStatus) {
      const key = application.statusNormalized as keyof typeof byStatus;
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    }

    if (application.score > 0) {
      totalScore += application.score;
      scored += 1;
      topScore = Math.max(topScore, application.score);
    }

    if (application.hasPdf) {
      withPdf += 1;
    }

    if (
      application.statusNormalized !== "skip" &&
      application.statusNormalized !== "rejected" &&
      application.statusNormalized !== "discarded"
    ) {
      actionable += 1;
    }
  }

  return {
    total: applications.length,
    byStatus,
    avgScore: scored > 0 ? totalScore / scored : 0,
    topScore,
    withPdf,
    actionable,
  };
}
