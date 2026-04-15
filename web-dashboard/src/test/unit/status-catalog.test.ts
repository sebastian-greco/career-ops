import { normalizeStatus } from "@/lib/server/parsers/status-catalog";
import type { StatusOption } from "@/lib/dashboard/types";

const statuses: StatusOption[] = [
  { id: "evaluated", label: "Evaluated", aliases: ["evaluada"], description: "", dashboardGroup: "evaluated" },
  { id: "applied", label: "Applied", aliases: ["aplicado", "sent"], description: "", dashboardGroup: "applied" },
  { id: "responded", label: "Responded", aliases: ["respondido"], description: "", dashboardGroup: "responded" },
  { id: "interview", label: "Interview", aliases: ["entrevista"], description: "", dashboardGroup: "interview" },
  { id: "offer", label: "Offer", aliases: ["oferta"], description: "", dashboardGroup: "offer" },
  { id: "rejected", label: "Rejected", aliases: ["rechazada"], description: "", dashboardGroup: "rejected" },
  { id: "discarded", label: "Discarded", aliases: ["cerrada"], description: "", dashboardGroup: "discarded" },
  { id: "skip", label: "SKIP", aliases: ["no_aplicar", "monitor"], description: "", dashboardGroup: "skip" },
];

describe("normalizeStatus", () => {
  it("maps aliases and strips formatting", () => {
    expect(normalizeStatus("**Applied**", statuses)).toBe("applied");
    expect(normalizeStatus("entrevista", statuses)).toBe("interview");
    expect(normalizeStatus("monitor", statuses)).toBe("skip");
  });

  it("strips trailing dates", () => {
    expect(normalizeStatus("Applied 2026-04-15", statuses)).toBe("applied");
  });
});
