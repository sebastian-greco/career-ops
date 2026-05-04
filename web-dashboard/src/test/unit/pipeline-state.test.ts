import type { DashboardApplication } from "@/lib/dashboard/types";
import { searchApplications, sortApplications, toPipelineSearchParams } from "@/lib/dashboard/pipeline-state";

const applications: DashboardApplication[] = [
  {
    number: 1,
    date: "2026-04-10",
    company: "Applied Co",
    role: "Senior Engineer",
    statusRaw: "Applied",
    statusNormalized: "applied",
    score: 4.8,
    scoreRaw: "4.8/5",
    hasPdf: true,
    reportPath: "reports/001.md",
    reportNumber: "001",
    notes: "Already submitted",
    jobUrl: "https://example.com/1",
  },
  {
    number: 2,
    date: "2026-04-11",
    company: "Eval Labs",
    role: "Staff Engineer",
    statusRaw: "Evaluated",
    statusNormalized: "evaluated",
    score: 4.2,
    scoreRaw: "4.2/5",
    hasPdf: true,
    reportPath: "reports/002.md",
    reportNumber: "002",
    notes: "Apply next",
    jobUrl: "https://example.com/2",
  },
  {
    number: 3,
    date: "2026-04-12",
    company: "Northwind",
    role: "AI Platform Lead",
    statusRaw: "Interview",
    statusNormalized: "interview",
    score: 4.6,
    scoreRaw: "4.6/5",
    hasPdf: true,
    reportPath: "reports/003.md",
    reportNumber: "003",
    notes: "Active process",
    jobUrl: "https://example.com/3",
  },
];

describe("pipeline-state", () => {
  it("filters by company or role search", () => {
    expect(searchApplications(applications, "eval").map((application) => application.reportNumber)).toEqual(["002"]);
    expect(searchApplications(applications, "platform").map((application) => application.reportNumber)).toEqual(["003"]);
    expect(searchApplications(applications, "")).toEqual(applications);
  });

  it("shows evaluated before applied in grouped order", () => {
    expect(sortApplications(applications, "score", "grouped").map((application) => application.reportNumber)).toEqual([
      "003",
      "002",
      "001",
    ]);
  });

  it("keeps search in pipeline URL state", () => {
    expect(toPipelineSearchParams("applied", "score", "grouped", "001", "  eval labs ")).toBe(
      "q=eval+labs&selected=001",
    );
  });
});
