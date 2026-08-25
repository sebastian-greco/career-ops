import { PageShortcuts } from "@/components/dashboard/page-shortcuts";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyCommandButton } from "@/components/dashboard/copy-command-button";
import { ReportRenderer } from "@/components/markdown/report-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function artifactHref(artifactPath: string) {
  return `/artifacts/${artifactPath.split("/").map(encodeURIComponent).join("/")}`;
}

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
  const applications = await caller.pipeline.applications();
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
    searchApplications(getFilteredApplications(applications, filter), search),
    sort,
    view,
  ).filter((application) => application.reportNumber);
  const currentIndex = orderedReports.findIndex((application) => application.reportNumber === reportId);
  const previousReport = currentIndex > 0 ? orderedReports[currentIndex - 1] : null;
  const nextReport = currentIndex >= 0 ? orderedReports[currentIndex + 1] ?? null : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="sticky top-[var(--dashboard-header-offset)] z-30 space-y-3 border-b border-border/40 bg-background/95 pb-3 pt-1 backdrop-blur sm:space-y-4 sm:pb-6 sm:pt-2">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Report {report.reportId}
          </p>
          <h2 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">{report.title}</h2>
        </div>
        <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Link href={backHref}>
            <Button variant="outline" className="h-11 shrink-0">← Pipeline</Button>
          </Link>
          {previousReport ? (
            <Link href={`/reports/${previousReport.reportNumber}?back=${encodeURIComponent(backHref)}`}>
              <Button variant="secondary" className="h-11 shrink-0">Previous</Button>
            </Link>
          ) : (
            <Button variant="secondary" className="h-11 shrink-0" disabled>Previous</Button>
          )}
          {nextReport ? (
            <Link href={`/reports/${nextReport.reportNumber}?back=${encodeURIComponent(backHref)}`}>
              <Button variant="secondary" className="h-11 shrink-0">Next</Button>
            </Link>
          ) : (
            <Button variant="secondary" className="h-11 shrink-0" disabled>Next</Button>
          )}
          {report.url ? (
            <a href={report.url} target="_blank" rel="noreferrer">
              <Button className="h-11 shrink-0">Open Job</Button>
            </a>
          ) : null}
          {report.jobDescriptionPath ? (
            <Link href={artifactHref(report.jobDescriptionPath)}>
              <Button variant="secondary" className="h-11 shrink-0">JD</Button>
            </Link>
          ) : null}
          {report.skillCoveragePath ? (
            <Link href={artifactHref(report.skillCoveragePath)}>
              <Button variant="secondary" className="h-11 shrink-0">Skills</Button>
            </Link>
          ) : null}
          {report.interviewPrepPath ? (
            <Link href={artifactHref(report.interviewPrepPath)}>
              <Button variant="secondary" className="h-11 shrink-0">Interview Prep</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <details className="group overflow-hidden rounded-xl border border-border/50 bg-card text-card-foreground shadow-xs">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 bg-muted/20 px-4 py-3 marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="font-bold">Report summary</p>
              <p className="text-sm text-muted-foreground">Score {report.scoreRaw || (report.score ? `${report.score.toFixed(1)}/5` : "not found")} · tap for details</p>
            </div>
            <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="grid gap-5 border-t border-border/40 p-4 text-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 sm:col-span-2 lg:col-span-1 lg:row-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overall Score</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {report.scoreRaw || (report.score ? `${report.score.toFixed(1)}/5` : "Not found")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyCommandButton command={`/career-ops-apply ${report.reportId}`} label="Apply" />
                <CopyCommandButton command={`/career-ops-json-cv ${report.reportId}`} label="JSON CV" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
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
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saved JD</p>
              {report.jobDescriptionPath ? (
                <Link className="font-mono text-xs text-primary underline-offset-4 hover:underline" href={artifactHref(report.jobDescriptionPath)}>
                  {report.jobDescriptionPath}
                </Link>
              ) : (
                <p className="font-medium text-foreground">Not found</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Skill Scan</p>
              {report.skillCoveragePath ? (
                <Link className="font-mono text-xs text-primary underline-offset-4 hover:underline" href={artifactHref(report.skillCoveragePath)}>
                  {report.skillCoveragePath}
                </Link>
              ) : (
                <p className="font-medium text-foreground">Not found</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Interview Prep</p>
              {report.interviewPrepPath ? (
                <Link className="font-mono text-xs text-primary underline-offset-4 hover:underline" href={artifactHref(report.interviewPrepPath)}>
                  {report.interviewPrepPath}
                </Link>
              ) : (
                <p className="font-medium text-foreground">Not found</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Form Questions</p>
              <p className="font-medium text-foreground">
                {report.applicationQuestions.length > 0 ? `${report.applicationQuestions.length} captured` : "Not found"}
              </p>
            </div>
          </div>
        </details>

        <Card className="overflow-hidden border-border/50 shadow-sm">
          <CardContent className="p-4 sm:p-8 lg:p-12">
            <ReportRenderer markdown={report.markdown} />
          </CardContent>
        </Card>
      </div>

      <PageShortcuts backHref={backHref} />
    </div>
  );
}
