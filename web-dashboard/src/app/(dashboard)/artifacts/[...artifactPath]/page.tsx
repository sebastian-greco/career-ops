import fs from "node:fs/promises";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportRenderer } from "@/components/markdown/report-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveArtifactPath } from "@/lib/server/artifact-path";
import { resolveCareerOpsRoot } from "@/lib/server/career-ops-root";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function artifactTitle(relativePath: string) {
  if (relativePath.startsWith("jds/") && relativePath.endsWith(".md")) {
    return "Job Description";
  }
  if (relativePath.endsWith("-skills.md")) {
    return "Skills Scan";
  }
  if (relativePath.startsWith("interview-prep/") && relativePath.endsWith(".md")) {
    return "Interview Prep";
  }
  return "Artifact";
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactPath: string[] }>;
}) {
  const { artifactPath } = await params;
  const root = resolveCareerOpsRoot();
  const resolvedArtifact = resolveArtifactPath(root, artifactPath);
  if (!resolvedArtifact) {
    notFound();
  }
  const { absolutePath, relativePath } = resolvedArtifact;

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
