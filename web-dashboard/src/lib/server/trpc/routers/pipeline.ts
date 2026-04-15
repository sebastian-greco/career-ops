import { z } from "zod";

import { publicProcedure, router } from "@/lib/server/trpc/init";

export const pipelineRouter = router({
  snapshot: publicProcedure.query(async ({ ctx }) => ctx.repository.getPipelineSnapshot()),
  refresh: publicProcedure.query(async ({ ctx }) => ctx.repository.getPipelineSnapshot()),
  updateStatus: publicProcedure
    .input(
      z.object({
        reportId: z.string().min(1),
        newStatus: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.repository.updateApplicationStatus(input.reportId, input.newStatus);
      return ctx.repository.getPipelineSnapshot();
    }),
});
