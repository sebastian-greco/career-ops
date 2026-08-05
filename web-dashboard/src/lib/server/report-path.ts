import fs from "node:fs/promises";
import path from "node:path";

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function relativeToRoot(careerOpsRoot: string, absolutePath: string) {
  return path.relative(careerOpsRoot, absolutePath);
}

export async function resolveTrackerReportPath(
  careerOpsRoot: string,
  trackerPath: string,
  reportLink: string,
) {
  const trackerRelativePath = path.resolve(path.dirname(trackerPath), reportLink);
  if (await exists(trackerRelativePath)) {
    return relativeToRoot(careerOpsRoot, trackerRelativePath);
  }

  const legacyRootRelativePath = path.resolve(careerOpsRoot, reportLink);
  if (await exists(legacyRootRelativePath)) {
    return relativeToRoot(careerOpsRoot, legacyRootRelativePath);
  }

  return reportLink;
}
