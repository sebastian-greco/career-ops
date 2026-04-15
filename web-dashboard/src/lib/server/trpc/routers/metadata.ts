import { publicProcedure, router } from "@/lib/server/trpc/init";

export const metadataRouter = router({
  statuses: publicProcedure.query(async ({ ctx }) => ctx.repository.getStatusCatalog()),
});
