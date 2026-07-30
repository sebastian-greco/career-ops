import superjson from "superjson";
import { initTRPC } from "@trpc/server";

import { resolveCareerOpsRoot } from "@/lib/server/career-ops-root";
import { FsCareerOpsRepository } from "@/lib/server/repository/fs-career-ops-repository";

export async function createTRPCContext({ request }: { request?: Request } = {}) {
  return {
    repository: new FsCareerOpsRepository(resolveCareerOpsRoot()),
    request,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
