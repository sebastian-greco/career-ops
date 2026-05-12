import fs from "node:fs/promises";
import path from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/pipeline">
          <Button variant="outline">Back to Pipeline</Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <CardTitle className="text-lg">Artifact</CardTitle>
          <CardDescription>{relativePath}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <pre className="overflow-x-auto p-6 text-sm leading-6 text-foreground">
            <code>{raw}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
