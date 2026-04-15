import { z } from "zod";

import { publicProcedure, router } from "@/lib/server/trpc/init";

export const reportsRouter = router({
  summary: publicProcedure
    .input(z.object({ reportId: z.string().min(1) }))
    .query(async ({ ctx, input }) => ctx.repository.getReportSummary(input.reportId)),
  document: publicProcedure
    .input(z.object({ reportId: z.string().min(1) }))
    .query(async ({ ctx, input }) => ctx.repository.getReportDocument(input.reportId)),
});
