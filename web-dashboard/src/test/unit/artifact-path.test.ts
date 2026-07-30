import { resolveArtifactPath } from "@/lib/server/artifact-path";

describe("resolveArtifactPath", () => {
  const root = "/career-ops";

  it("allows only dashboard artifact directories", () => {
    expect(resolveArtifactPath(root, ["jds", "001-role.md"])?.relativePath).toBe("jds/001-role.md");
    expect(resolveArtifactPath(root, ["reports", "001-role-skills.md"])?.relativePath).toBe(
      "reports/001-role-skills.md",
    );
    expect(resolveArtifactPath(root, ["interview-prep", "company-role.md"])?.relativePath).toBe(
      "interview-prep/company-role.md",
    );
  });

  it("rejects repository files and traversal attempts", () => {
    expect(resolveArtifactPath(root, [".env"])).toBeNull();
    expect(resolveArtifactPath(root, ["cv.md"])).toBeNull();
    expect(resolveArtifactPath(root, ["..", ".env"])).toBeNull();
    expect(resolveArtifactPath(root, ["reports", "001-role.md"])).toBeNull();
  });
});
