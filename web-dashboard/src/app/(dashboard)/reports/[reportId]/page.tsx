import { PageShortcuts } from "@/components/dashboard/page-shortcuts";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportRenderer } from "@/components/markdown/report-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  coerceFilter,
  coerceSearch,
  coerceSort,
  coerceView,
  getFilteredApplications,
  searchApplications,
  sortApplications,
} from "@/lib/dashboard/pipeline-state";
import { getServerCaller } from "@/lib/server/trpc/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reportId } = await params;
  const query = await searchParams;
  const backHref = typeof query.back === "string" && query.back.startsWith("/pipeline") ? query.back : "/pipeline";
  const caller = await getServerCaller();
  const snapshot = await caller.pipeline.snapshot();
  const report = await caller.reports.document({ reportId });

  if (!report) {
    notFound();
  }

  const backUrl = new URL(backHref, "http://localhost");
  const filter = coerceFilter(backUrl.searchParams.get("filter") ?? undefined);
  const sort = coerceSort(backUrl.searchParams.get("sort") ?? undefined);
  const view = coerceView(backUrl.searchParams.get("view") ?? undefined);
  const search = coerceSearch(backUrl.searchParams.get("q") ?? undefined);
  const orderedReports = sortApplications(
    searchApplications(getFilteredApplications(snapshot.applications, filter), search),
    sort,
    view,
  ).filter((application) => application.reportNumber);
  const currentIndex = orderedReports.findIndex((application) => application.reportNumber === reportId);
  const previousReport = currentIndex > 0 ? orderedReports[currentIndex - 1] : null;
  const nextReport = currentIndex >= 0 ? orderedReports[currentIndex + 1] ?? null : null;

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 space-y-4 border-b border-border/40 bg-background/95 pb-6 pt-2 backdrop-blur">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Report {report.reportId}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{report.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={backHref}>
            <Button variant="outline">Back to Pipeline</Button>
          </Link>
          {previousReport ? (
            <Link href={`/reports/${previousReport.reportNumber}?back=${encodeURIComponent(backHref)}`}>
              <Button variant="secondary">Previous</Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled>Previous</Button>
          )}
          {nextReport ? (
            <Link href={`/reports/${nextReport.reportNumber}?back=${encodeURIComponent(backHref)}`}>
              <Button variant="secondary">Next</Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled>Next</Button>
          )}
          {report.url ? (
            <a href={report.url} target="_blank" rel="noreferrer">
              <Button>Open Job URL</Button>
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="sticky top-24 border-border/50 shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <CardTitle className="text-lg">Metadata</CardTitle>
            <CardDescription>Parsed from the report header and summary blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-sm">
            <div className="rounded-xl border border-border bg-accent/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overall Score</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {report.scoreRaw || (report.score ? `${report.score.toFixed(1)}/5` : "Not found")}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Archetype</p>
              <p className="font-medium text-foreground">{report.archetype || "Not found"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">TL;DR</p>
              <p className="text-muted-foreground leading-relaxed">{report.tldr || "Not found"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Remote</p>
              <p className="font-medium text-foreground">{report.remote || "Not found"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comp</p>
              <p className="font-medium text-foreground">{report.compEstimate || "Not found"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legitimacy</p>
              <p className="font-medium text-foreground">{report.legitimacy || "Not found"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-8 sm:p-12">
            <ReportRenderer markdown={report.markdown} />
          </CardContent>
        </Card>
      </div>

      <PageShortcuts backHref={backHref} />
    </div>
  );
}
