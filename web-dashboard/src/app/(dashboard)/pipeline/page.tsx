import { PipelineList } from "@/components/dashboard/pipeline-list";
import { coerceFilter, coerceSearch, coerceSort, coerceView } from "@/lib/dashboard/pipeline-state";
import { getServerCaller } from "@/lib/server/trpc/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = coerceFilter(typeof params.filter === "string" ? params.filter : undefined);
  const sort = coerceSort(typeof params.sort === "string" ? params.sort : undefined);
  const view = coerceView(typeof params.view === "string" ? params.view : undefined);
  const search = coerceSearch(typeof params.q === "string" ? params.q : undefined);
  const selected = typeof params.selected === "string" ? params.selected : undefined;

  const caller = await getServerCaller();
  const snapshot = await caller.pipeline.snapshot();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard
          </p>
          <h2 className="text-2xl font-semibold">Pipeline</h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          Filesystem-backed pipeline with keyboard navigation, grouped view, preview loading, refresh, and inline status updates.
        </p>
      </div>

      <PipelineList
        initialSnapshot={snapshot}
        initialFilter={filter}
        initialSort={sort}
        initialView={view}
        initialSearch={search}
        initialSelectedReportId={selected}
      />
    </div>
  );
}
