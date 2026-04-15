import type {
  DashboardApplication,
  ProgressMetrics,
  ScoreBucket,
} from "@/lib/dashboard/types";

function getIsoWeekKey(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const day = Number.parseInt(match[3] ?? "", 10);
  const current = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(current.getTime())) {
    return null;
  }

  const dayOfWeek = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - dayOfWeek);
  const isoYear = current.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const diffInDays = Math.floor((current.getTime() - yearStart.getTime()) / 86400000);
  const isoWeek = Math.floor(diffInDays / 7) + 1;

  return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
}

function safePct(part: number, whole: number) {
  if (whole === 0) {
    return 0;
  }
  return (part / whole) * 100;
}

export function computeProgressMetrics(applications: DashboardApplication[]): ProgressMetrics {
  const statusCounts = new Map<string, number>();
  const weekCounts = new Map<string, number>();
  let totalScore = 0;
  let scored = 0;
  let topScore = 0;
  let totalOffers = 0;
  let activeApps = 0;

  for (const application of applications) {
    const status = application.statusNormalized;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

    if (application.score > 0) {
      totalScore += application.score;
      scored += 1;
      topScore = Math.max(topScore, application.score);
    }

    if (status === "offer") {
      totalOffers += 1;
    }

    if (!["skip", "rejected", "discarded"].includes(status)) {
      activeApps += 1;
    }

    if (application.date) {
      const key = getIsoWeekKey(application.date);
      if (key) {
        weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const total = applications.length;
  const applied =
    (statusCounts.get("applied") ?? 0) +
    (statusCounts.get("responded") ?? 0) +
    (statusCounts.get("interview") ?? 0) +
    (statusCounts.get("offer") ?? 0) +
    (statusCounts.get("rejected") ?? 0);
  const responded =
    (statusCounts.get("responded") ?? 0) +
    (statusCounts.get("interview") ?? 0) +
    (statusCounts.get("offer") ?? 0);
  const interview = (statusCounts.get("interview") ?? 0) + (statusCounts.get("offer") ?? 0);
  const offer = statusCounts.get("offer") ?? 0;

  const buckets = [0, 0, 0, 0, 0];
  for (const application of applications) {
    if (application.score <= 0) {
      continue;
    }
    if (application.score >= 4.5) {
      buckets[0] += 1;
    } else if (application.score >= 4.0) {
      buckets[1] += 1;
    } else if (application.score >= 3.5) {
      buckets[2] += 1;
    } else if (application.score >= 3.0) {
      buckets[3] += 1;
    } else {
      buckets[4] += 1;
    }
  }

  const scoreBuckets: ScoreBucket[] = [
    { label: "4.5-5.0", count: buckets[0] },
    { label: "4.0-4.4", count: buckets[1] },
    { label: "3.5-3.9", count: buckets[2] },
    { label: "3.0-3.4", count: buckets[3] },
    { label: "<3.0", count: buckets[4] },
  ];

  const weeklyActivity = [...weekCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, count]) => ({ week, count }));

  return {
    funnelStages: [
      { label: "Evaluated", count: total, pct: 100 },
      { label: "Applied", count: applied, pct: safePct(applied, total) },
      { label: "Responded", count: responded, pct: safePct(responded, applied) },
      { label: "Interview", count: interview, pct: safePct(interview, applied) },
      { label: "Offer", count: offer, pct: safePct(offer, applied) },
    ],
    scoreBuckets,
    weeklyActivity,
    responseRate: safePct(responded, applied),
    interviewRate: safePct(interview, applied),
    offerRate: safePct(offer, applied),
    avgScore: scored > 0 ? totalScore / scored : 0,
    topScore,
    totalOffers,
    activeApps,
  };
}
