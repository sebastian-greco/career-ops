import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressMetrics } from "@/lib/dashboard/types";

function maxCount(values: number[]) {
  return values.reduce((current, value) => Math.max(current, value), 0);
}

function BarRow({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function ProgressPanels({ metrics }: { metrics: ProgressMetrics }) {
  const funnelMax = maxCount(metrics.funnelStages.map((stage) => stage.count));
  const scoreMax = maxCount(metrics.scoreBuckets.map((bucket) => bucket.count));
  const weeklyMax = maxCount(metrics.weeklyActivity.map((week) => week.count));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Funnel</CardTitle>
          <CardDescription>Stage progression from evaluated to offer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.funnelStages.map((stage) => (
            <BarRow key={stage.label} label={stage.label} value={stage.count} max={funnelMax} suffix={stage.label === "Evaluated" ? "" : ` · ${stage.pct.toFixed(0)}%`} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
          <CardDescription>Applied-stage conversion health.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4 bg-card text-card-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Response rate</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.responseRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card text-card-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Interview rate</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.interviewRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card text-card-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Offer rate</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.offerRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-card text-card-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Active / Offers</p>
            <p className="mt-2 text-3xl font-semibold">
              {metrics.activeApps} / {metrics.totalOffers}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>Snapshot of tracker quality.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.scoreBuckets.map((bucket) => (
            <BarRow key={bucket.label} label={bucket.label} value={bucket.count} max={scoreMax} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Last 8 weeks derived from tracker dates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.weeklyActivity.length > 0 ? (
            metrics.weeklyActivity.map((week) => (
              <BarRow key={week.week} label={week.week} value={week.count} max={weeklyMax} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No weekly activity data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
