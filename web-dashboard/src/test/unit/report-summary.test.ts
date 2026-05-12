import { parseReportSummary } from "@/lib/server/parsers/report-summary";

describe("parseReportSummary", () => {
  it("extracts summary fields from report tables, headers, and artifacts", () => {
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

## H) Artifact
- Job description saved: \`jds/001-duckduckgo-engineering-director-backend-2026-04-10.md\`
- Skill coverage scan: \`reports/001-duckduckgo-2026-04-10-skills.md\`
- Resume artifact generated: \`output/001-cv-duckduckgo.json\`

## I) Application Form Questions
- Why are you interested in this role?
- Do you have the right to work in the EU?
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
      jobDescriptionPath: "jds/001-duckduckgo-engineering-director-backend-2026-04-10.md",
      skillCoveragePath: "reports/001-duckduckgo-2026-04-10-skills.md",
      resumeArtifactPath: "output/001-cv-duckduckgo.json",
    });
    expect(summary.tldr).toContain("remote-first company");
    expect(summary.compEstimate).toContain("Clears the target range");
    expect(summary.applicationQuestions).toEqual([
      "Why are you interested in this role?",
      "Do you have the right to work in the EU?",
    ]);
  });
});
