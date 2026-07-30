import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { canWriteDashboard } from "@/lib/server/dashboard-write-access";
import { publicProcedure, router } from "@/lib/server/trpc/init";

export const pipelineRouter = router({
  applications: publicProcedure.query(async ({ ctx }) => ctx.repository.getPipelineApplications()),
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
      if (!canWriteDashboard(ctx.request)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Dashboard writes require localhost access or DASHBOARD_WRITE_TOKEN.",
        });
      }
      await ctx.repository.updateApplicationStatus(input.reportId, input.newStatus);
      return ctx.repository.getPipelineSnapshot();
    }),
});
