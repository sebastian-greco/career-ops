import { timingSafeEqual } from "node:crypto";

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function hasMatchingToken(expected: string, actual: string | null) {
  if (!actual || expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function canWriteDashboard(request: Request | undefined, writeToken = process.env.DASHBOARD_WRITE_TOKEN) {
  if (!request) {
    return false;
  }

  if (writeToken) {
    return hasMatchingToken(writeToken, request.headers.get("x-career-ops-dashboard-token"));
  }

  const requestUrl = new URL(request.url);
  if (!isLoopbackHost(requestUrl.hostname)) {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === requestUrl.origin;
  } catch {
    return false;
  }
}
