import { PageShortcuts } from "@/components/dashboard/page-shortcuts";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportRenderer } from "@/components/markdown/report-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const report = await caller.reports.document({ reportId });

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Report {report.reportId}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{report.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={backHref}
            className="rounded-md border border-border/50 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Back to Pipeline
          </Link>
          {report.url ? (
            <a
              href={report.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Open Job URL
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
