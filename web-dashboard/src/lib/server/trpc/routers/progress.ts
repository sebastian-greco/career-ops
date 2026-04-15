import { publicProcedure, router } from "@/lib/server/trpc/init";

export const progressRouter = router({
  snapshot: publicProcedure.query(async ({ ctx }) => ctx.repository.getProgressSnapshot()),
});
