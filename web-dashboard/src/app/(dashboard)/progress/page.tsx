import { PageShortcuts } from "@/components/dashboard/page-shortcuts";
import { ProgressPanels } from "@/components/dashboard/progress-panels";
import { getServerCaller } from "@/lib/server/trpc/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const backHref = typeof query.back === "string" && query.back.startsWith("/pipeline") ? query.back : "/pipeline";
  const caller = await getServerCaller();
  const snapshot = await caller.progress.snapshot();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard
        </p>
        <h2 className="text-2xl font-semibold">Progress</h2>
      </div>
      <ProgressPanels metrics={snapshot.metrics} />
      <PageShortcuts backHref={backHref} />
    </div>
  );
}
