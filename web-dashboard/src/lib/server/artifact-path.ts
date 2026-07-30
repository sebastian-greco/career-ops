import path from "node:path";

function isAllowedArtifactPath(relativePath: string) {
  return (
    (relativePath.startsWith("jds/") && relativePath.endsWith(".md")) ||
    (relativePath.startsWith("interview-prep/") && relativePath.endsWith(".md")) ||
    (relativePath.startsWith("reports/") && relativePath.endsWith("-skills.md"))
  );
}

export function resolveArtifactPath(root: string, parts: string[]) {
  const joinedPath = parts.join("/");
  if (!joinedPath) {
    return null;
  }

  const relativePath = path.posix.normalize(joinedPath).replace(/^\/+/, "");
  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    relativePath.includes("../") ||
    !isAllowedArtifactPath(relativePath)
  ) {
    return null;
  }

  const absolutePath = path.resolve(root, relativePath);
  const relativeFromRoot = path.relative(root, absolutePath);
  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    return null;
  }

  return { absolutePath, relativePath };
}
