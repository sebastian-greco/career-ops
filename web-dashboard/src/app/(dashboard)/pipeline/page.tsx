import { PipelineList } from "@/components/dashboard/pipeline-list";
import { coerceFilter, coercePage, coerceSearch, coerceSort, coerceView } from "@/lib/dashboard/pipeline-state";
import { getServerCaller } from "@/lib/server/trpc/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasExplicitFilter = typeof params.filter === "string";
  const filter = coerceFilter(typeof params.filter === "string" ? params.filter : undefined);
  const sort = coerceSort(typeof params.sort === "string" ? params.sort : undefined);
  const view = coerceView(typeof params.view === "string" ? params.view : undefined);
  const search = coerceSearch(typeof params.q === "string" ? params.q : undefined);
  const page = coercePage(typeof params.page === "string" ? params.page : undefined);
  const selected = typeof params.selected === "string" ? params.selected : undefined;

  const caller = await getServerCaller();
  const snapshot = await caller.pipeline.snapshot();

  return (
      <PipelineList
        initialSnapshot={snapshot}
        initialFilter={filter}
        initialSort={sort}
        initialView={view}
        initialSearch={search}
        initialPage={page}
        initialSelectedReportId={selected}
        initialHasExplicitFilter={hasExplicitFilter}
      />
  );
}
