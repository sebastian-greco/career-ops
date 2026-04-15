import { FsCareerOpsRepository } from "@/lib/server/repository/fs-career-ops-repository";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function makeFixtureRepo(applicationsContents: string) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "career-ops-web-dashboard-"));
  await fs.mkdir(path.join(root, "data"), { recursive: true });
  await fs.mkdir(path.join(root, "templates"), { recursive: true });
  await fs.writeFile(path.join(root, "data", "applications.md"), applicationsContents, "utf8");
  await fs.writeFile(
    path.join(root, "templates", "states.yml"),
    `states:
  - id: evaluated
    label: Evaluated
  - id: applied
    label: Applied
  - id: responded
    label: Responded
  - id: interview
    label: Interview
  - id: offer
    label: Offer
  - id: rejected
    label: Rejected
  - id: discarded
    label: Discarded
  - id: skip
    label: SKIP
    aliases: [skip]
`,
    "utf8",
  );
  return root;
}

describe("FsCareerOpsRepository.updateApplicationStatus", () => {
  it("rewrites the status cell for pipe-delimited tracker rows", async () => {
    const repoRoot = await makeFixtureRepo(`| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-04-10 | DuckDuckGo | Engineering Director | 4.7/5 | Evaluated | ✅ | [001](reports/001.md) | Strong fit |
`);

    const repository = new FsCareerOpsRepository(repoRoot);
    await repository.updateApplicationStatus("001", "Applied");

    const updated = await fs.readFile(path.join(repoRoot, "data", "applications.md"), "utf8");
    expect(updated).toContain("| 1 | 2026-04-10 | DuckDuckGo | Engineering Director | 4.7/5 | Applied | ✅ | [001](reports/001.md) | Strong fit |");
  });

  it("rewrites the status cell for tab-delimited tracker rows", async () => {
    const repoRoot = await makeFixtureRepo(`| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1\t2026-04-10\tDuckDuckGo\tEngineering Director\t4.7/5\tEvaluated\t✅\t[001](reports/001.md)\tStrong fit |
`);

    const repository = new FsCareerOpsRepository(repoRoot);
    await repository.updateApplicationStatus("001", "Interview");

    const updated = await fs.readFile(path.join(repoRoot, "data", "applications.md"), "utf8");
    expect(updated).toContain("| 1\t2026-04-10\tDuckDuckGo\tEngineering Director\t4.7/5\tInterview\t✅\t[001](reports/001.md)\tStrong fit |");
  });
});
