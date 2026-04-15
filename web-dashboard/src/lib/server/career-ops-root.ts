import path from "node:path";

export function resolveCareerOpsRoot() {
  const configured = process.env.CAREER_OPS_ROOT;
  if (configured) {
    return path.resolve(configured);
  }

  return path.resolve(process.cwd(), "..");
}
