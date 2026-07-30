import { canWriteDashboard } from "@/lib/server/dashboard-write-access";

describe("canWriteDashboard", () => {
  it("allows same-origin localhost writes without a configured token", () => {
    const request = new Request("http://localhost:3001/api/trpc/pipeline.updateStatus", {
      headers: { origin: "http://localhost:3001" },
    });

    expect(canWriteDashboard(request, "")).toBe(true);
  });

  it("rejects cross-origin and non-loopback writes without a configured token", () => {
    const crossOrigin = new Request("http://localhost:3001/api/trpc/pipeline.updateStatus", {
      headers: { origin: "https://attacker.example" },
    });
    const remote = new Request("https://dashboard.example/api/trpc/pipeline.updateStatus");

    expect(canWriteDashboard(crossOrigin, "")).toBe(false);
    expect(canWriteDashboard(remote, "")).toBe(false);
  });

  it("requires the configured token when the dashboard is exposed", () => {
    const token = "a-long-dashboard-token";
    const validRequest = new Request("https://dashboard.example/api/trpc/pipeline.updateStatus", {
      headers: { "x-career-ops-dashboard-token": token },
    });
    const invalidRequest = new Request("https://dashboard.example/api/trpc/pipeline.updateStatus", {
      headers: { "x-career-ops-dashboard-token": "wrong-token" },
    });

    expect(canWriteDashboard(validRequest, token)).toBe(true);
    expect(canWriteDashboard(invalidRequest, token)).toBe(false);
  });
});
