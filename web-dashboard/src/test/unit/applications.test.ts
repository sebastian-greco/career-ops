import { parseApplicationsMarkdown } from "@/lib/server/parsers/applications";

describe("parseApplicationsMarkdown", () => {
  it("parses tracker rows and report links", () => {
    const raw = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-10 | DuckDuckGo | Engineering Director | 4.7/5 | Applied | ✅ | [001](reports/001-duckduckgo.md) | Strong fit |
`;

    const applications = parseApplicationsMarkdown(raw, (status) => status.toLowerCase());

    expect(applications).toHaveLength(1);
    expect(applications[0]).toMatchObject({
      number: 1,
      company: "DuckDuckGo",
      role: "Engineering Director",
      score: 4.7,
      hasPdf: true,
      reportNumber: "001",
      reportPath: "reports/001-duckduckgo.md",
    });
  });

  it("parses trackers with the optional Via column", () => {
    const raw = `| # | Date | Company | Via | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|-----|------|-------|--------|-----|--------|-------|
| 905 | 2026-08-18 | WeRoad | — | Head of Product Engineering | 4.1/5 | Evaluated | ❌ | [905](../reports/905-weroad.md) | Strong fit |
`;

    const applications = parseApplicationsMarkdown(raw, (status) => status.toLowerCase());

    expect(applications[0]).toMatchObject({
      company: "WeRoad",
      role: "Head of Product Engineering",
      score: 4.1,
      statusNormalized: "evaluated",
      reportNumber: "905",
      notes: "Strong fit",
    });
  });
});
