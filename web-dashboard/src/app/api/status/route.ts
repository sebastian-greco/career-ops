import { NextResponse } from "next/server";

import { canWriteDashboard } from "@/lib/server/dashboard-write-access";
import { createTRPCContext } from "@/lib/server/trpc/init";

function safeBackPath(value: FormDataEntryValue | null) {
  return typeof value === "string" && (value === "/pipeline" || value.startsWith("/pipeline?"))
    ? value
    : "/pipeline";
}

function requestOrigin(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return host ? `${protocol}://${host}` : new URL(request.url).origin;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const reportId = form.get("reportId");
  const newStatus = form.get("newStatus");
  const token = form.get("token");
  const back = safeBackPath(form.get("back"));

  if (typeof reportId !== "string" || !reportId.trim() || typeof newStatus !== "string" || !newStatus.trim()) {
    return NextResponse.json({ error: "Report and status are required." }, { status: 400 });
  }

  const authorizedHeaders = new Headers(request.headers);
  if (typeof token === "string" && token) {
    authorizedHeaders.set("x-career-ops-dashboard-token", token);
  }
  const authorizedRequest = new Request(request.url, { headers: authorizedHeaders, method: "POST" });

  if (!canWriteDashboard(authorizedRequest)) {
    return NextResponse.json({ error: "Dashboard status writes are not enabled for this device." }, { status: 403 });
  }

  const { repository } = await createTRPCContext({ request: authorizedRequest });
  await repository.updateApplicationStatus(reportId.trim(), newStatus.trim());
  return NextResponse.redirect(new URL(back, requestOrigin(request)), 303);
}
