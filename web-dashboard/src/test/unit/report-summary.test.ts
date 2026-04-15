import { parseReportSummary } from "@/lib/server/parsers/report-summary";

describe("parseReportSummary", () => {
  it("extracts summary fields from report tables and headers", () => {
    const raw = `# Evaluation: DuckDuckGo -- Engineering Director, Backend

**Date:** 2026-04-10
**Archetype:** Platform / Backend Leadership
**URL:** https://example.com/job
**Legitimacy:** High Confidence
**PDF:** output/cv.pdf

## A) Role Summary

| Field | Value |
|-------|-------|
| **Archetype** | Platform / Backend Leadership |
| **Remote** | Full remote |
| **TL;DR** | Senior backend leadership role for a remote-first company. |

**Comp read:** Strong. Clears the target range.
`;

    const summary = parseReportSummary("reports/001-duckduckgo.md", raw);

    expect(summary).toMatchObject({
      reportId: "001",
      title: "Evaluation: DuckDuckGo -- Engineering Director, Backend",
      archetype: "Platform / Backend Leadership",
      remote: "Full remote",
      url: "https://example.com/job",
      legitimacy: "High Confidence",
      pdf: "output/cv.pdf",
    });
    expect(summary.tldr).toContain("remote-first company");
    expect(summary.compEstimate).toContain("Clears the target range");
  });
});
