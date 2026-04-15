import { cache } from "react";

import { appRouter } from "@/lib/server/trpc/root";
import { createTRPCContext } from "@/lib/server/trpc/init";

export const getServerCaller = cache(async () => {
  const context = await createTRPCContext();
  return appRouter.createCaller(context);
});
