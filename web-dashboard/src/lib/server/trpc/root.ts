import { router } from "@/lib/server/trpc/init";
import { metadataRouter } from "@/lib/server/trpc/routers/metadata";
import { pipelineRouter } from "@/lib/server/trpc/routers/pipeline";
import { progressRouter } from "@/lib/server/trpc/routers/progress";
import { reportsRouter } from "@/lib/server/trpc/routers/reports";

export const appRouter = router({
  pipeline: pipelineRouter,
  reports: reportsRouter,
  progress: progressRouter,
  metadata: metadataRouter,
});

export type AppRouter = typeof appRouter;
