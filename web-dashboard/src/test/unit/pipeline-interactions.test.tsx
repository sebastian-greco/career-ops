import { render, screen } from "@testing-library/react";

import { PipelineList } from "@/components/dashboard/pipeline-list";
import type { PipelineSnapshot } from "@/lib/dashboard/types";

const snapshot: PipelineSnapshot = {
  applications: [{
    number: 1,
    date: "2026-04-10",
    company: "Applied Co",
    role: "Senior Engineer",
    statusRaw: "Applied",
    statusNormalized: "applied",
    score: 4.8,
    scoreRaw: "4.8/5",
    hasPdf: true,
    reportPath: "reports/001-applied-co.md",
    reportNumber: "001",
    notes: "",
    jobUrl: "https://example.com/1",
    compEstimate: "€100k",
  }],
  metrics: { total: 1, byStatus: { applied: 1 }, avgScore: 4.8, topScore: 4.8, withPdf: 1, actionable: 1 },
  filterCounts: { all: 1, evaluated: 0, applied: 1, interview: 0, rejected: 0, skip: 0, top: 1 },
  statuses: [
    { id: "evaluated", label: "Evaluated", aliases: [], description: "", dashboardGroup: "evaluated" },
    { id: "applied", label: "Applied", aliases: [], description: "", dashboardGroup: "applied" },
  ],
};

describe("pipeline progressive interactions", () => {
  it("renders navigation and write actions as native links and forms", () => {
    render(
      <PipelineList
        initialSnapshot={snapshot}
        initialFilter="applied"
        initialSort="score"
        initialView="grouped"
        initialSearch=""
        initialHasExplicitFilter
      />,
    );

    expect(screen.getByRole("link", { name: "Rejected 0" })).toHaveAttribute("href", "/pipeline?filter=rejected");
    expect(screen.getByRole("link", { name: "Grouped" })).toHaveAttribute("href", "/pipeline?view=flat");
    expect(screen.getAllByRole("link", { name: /Applied Co/ })[0]).toHaveAttribute(
      "href",
      "/reports/001?back=%2Fpipeline%3Fselected%3D001",
    );

    const searchForm = screen.getByRole("searchbox", { name: "Search company or role" }).closest("form");
    expect(searchForm).toHaveAttribute("action", "/pipeline");
    expect(searchForm).toHaveAttribute("method", "get");

    const statusForm = screen.getAllByRole("combobox", { name: "Status for Applied Co" })[0].closest("form");
    expect(statusForm).toHaveAttribute("action", "/api/status");
    expect(statusForm).toHaveAttribute("method", "post");
  });
});
