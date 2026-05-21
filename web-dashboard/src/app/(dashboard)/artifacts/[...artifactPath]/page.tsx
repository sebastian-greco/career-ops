import fs from "node:fs/promises";
import path from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportRenderer } from "@/components/markdown/report-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveCareerOpsRoot } from "@/lib/server/career-ops-root";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeArtifactPath(parts: string[]) {
  const relativePath = parts.join("/");
  if (!relativePath) {
    return "";
  }

  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..") || normalized.includes("../")) {
    return "";
  }

  return normalized;
}

function artifactTitle(relativePath: string) {
  if (relativePath.startsWith("jds/") && relativePath.endsWith(".md")) {
    return "Job Description";
  }
  if (relativePath.endsWith("-skills.md")) {
    return "Skills Scan";
  }
  return "Artifact";
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactPath: string[] }>;
}) {
  const { artifactPath } = await params;
  const relativePath = normalizeArtifactPath(artifactPath);
  if (!relativePath) {
    notFound();
  }

  const root = resolveCareerOpsRoot();
  const absolutePath = path.resolve(root, relativePath);
  const relativeFromRoot = path.relative(root, absolutePath);

  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    notFound();
  }

  let raw = "";
  try {
    raw = await fs.readFile(absolutePath, "utf8");
  } catch {
    notFound();
  }

  const isMarkdownArtifact = relativePath.endsWith(".md");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/pipeline">
          <Button variant="outline">Back to Pipeline</Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <CardTitle className="text-lg">{artifactTitle(relativePath)}</CardTitle>
          <CardDescription>{relativePath}</CardDescription>
        </CardHeader>
        {isMarkdownArtifact ? (
          <CardContent className="p-8 sm:p-12">
            <ReportRenderer markdown={raw} />
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <pre className="overflow-x-auto p-6 text-sm leading-6 text-foreground">
              <code>{raw}</code>
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
