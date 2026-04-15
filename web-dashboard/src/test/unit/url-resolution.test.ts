import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { DashboardApplication } from "@/lib/dashboard/types";
import { enrichApplicationUrls } from "@/lib/server/parsers/url-resolution";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "career-ops-url-resolution-"));
  await fs.mkdir(path.join(root, "batch"), { recursive: true });
  await fs.mkdir(path.join(root, "reports"), { recursive: true });
  return root;
}

function makeApplication(overrides: Partial<DashboardApplication>): DashboardApplication {
  return {
    number: 1,
    date: "2026-04-10",
    company: "DuckDuckGo",
    role: "Engineering Director",
    statusRaw: "Evaluated",
    statusNormalized: "evaluated",
    score: 4.7,
    scoreRaw: "4.7/5",
    hasPdf: true,
    reportPath: "reports/001.md",
    reportNumber: "001",
    notes: "Strong fit",
    jobUrl: "",
    ...overrides,
  };
}

describe("enrichApplicationUrls", () => {
  it("prefers the report header URL when present", async () => {
    const root = await makeRepo();
    await fs.writeFile(path.join(root, "reports", "001.md"), "**URL:** https://example.com/from-report\n", "utf8");

    const applications = [makeApplication({})];
    await enrichApplicationUrls(root, applications);

    expect(applications[0]?.jobUrl).toBe("https://example.com/from-report");
  });

  it("falls back to batch id lookup from the report header", async () => {
    const root = await makeRepo();
    await fs.writeFile(
      path.join(root, "reports", "001.md"),
      "**Batch ID:** 12\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(root, "batch", "batch-input.tsv"),
      "id\turl\tsource\tnotes\n12\thttps://jackjill.test\tbatch\tEngineering Director @ DuckDuckGo | 92 | https://example.com/from-batch\n",
      "utf8",
    );

    const applications = [makeApplication({})];
    await enrichApplicationUrls(root, applications);

    expect(applications[0]?.jobUrl).toBe("https://example.com/from-batch");
  });
});
