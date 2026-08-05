import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { resolveTrackerReportPath } from "@/lib/server/report-path";
import { FsCareerOpsRepository } from "@/lib/server/repository/fs-career-ops-repository";

async function makeCareerOpsRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "career-ops-report-path-"));
  await fs.mkdir(path.join(root, "data"), { recursive: true });
  await fs.mkdir(path.join(root, "reports"), { recursive: true });
  await fs.mkdir(path.join(root, "templates"), { recursive: true });
  await fs.writeFile(path.join(root, "reports", "001-acme.md"), "# Evaluation: Acme", "utf8");
  await fs.writeFile(
    path.join(root, "templates", "states.yml"),
    "states:\n  - id: evaluated\n    label: Evaluated\n",
    "utf8",
  );
  return root;
}

describe("resolveTrackerReportPath", () => {
  it("resolves links relative to a tracker in data/", async () => {
    const root = await makeCareerOpsRoot();
    const trackerPath = path.join(root, "data", "applications.md");

    await expect(resolveTrackerReportPath(root, trackerPath, "../reports/001-acme.md")).resolves.toBe(
      path.join("reports", "001-acme.md"),
    );
  });

  it("keeps legacy repository-root-relative links working", async () => {
    const root = await makeCareerOpsRoot();
    const trackerPath = path.join(root, "data", "applications.md");

    await expect(resolveTrackerReportPath(root, trackerPath, "reports/001-acme.md")).resolves.toBe(
      path.join("reports", "001-acme.md"),
    );
  });

  it("preserves a missing link so the repository can fail closed", async () => {
    const root = await makeCareerOpsRoot();
    const trackerPath = path.join(root, "data", "applications.md");

    await expect(resolveTrackerReportPath(root, trackerPath, "../reports/999-missing.md")).resolves.toBe(
      "../reports/999-missing.md",
    );
  });
});

describe("FsCareerOpsRepository report paths", () => {
  it("loads a report linked relative to data/applications.md", async () => {
    const root = await makeCareerOpsRoot();
    await fs.writeFile(
      path.join(root, "data", "applications.md"),
      `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-08-04 | Acme | Engineering Manager | 4.6/5 | Evaluated | ❌ | [001](../reports/001-acme.md) | Strong fit |
`,
      "utf8",
    );

    const repository = new FsCareerOpsRepository(root);
    const report = await repository.getReportDocument("001");

    expect(report).toMatchObject({
      reportId: "001",
      reportPath: path.join("reports", "001-acme.md"),
      title: "Evaluation: Acme",
    });
  });
});
