import path from "node:path";

import type { ReportSummary } from "@/lib/dashboard/types";

const archetypeTableRegex = /\*\*Arquetipo(?:\s+detectado)?\*\*\s*\|\s*(.+)/i;
const archetypeColonRegex = /\*\*(?:Arquetipo|Archetype):\*\*\s*(.+)/i;
const tldrTableRegex = /\*\*TL;DR\*\*\s*\|\s*(.+)/i;
const tldrColonRegex = /\*\*TL;DR:\*\*\s*(.+)/i;
const remoteRegex = /\*\*Remote\*\*\s*\|\s*(.+)/i;
const compRegex = /\*\*(?:Comp|Comp read|Comp verdict|Comp assessment):\*\*\s*(.+)/i;
const scoreRegex = /\*\*Score:\*\*\s*([^\n]+)/i;
const scoreValueRegex = /(\d+(?:\.\d+)?)\/5/;
const titleRegex = /^#\s+(.+)$/m;
const urlRegex = /^\*\*URL:\*\*\s*(https?:\/\/\S+)/m;
const legitimacyRegex = /^\*\*Legitimacy:\*\*\s*(.+)$/m;
const pdfRegex = /^\*\*PDF:\*\*\s*(.+)$/m;

function cleanCell(value: string) {
  return value.trim().replace(/\|$/, "").trim();
}

function truncate(text: string, max = 120) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 3)}...`;
}

export function parseReportSummary(reportPath: string, raw: string): ReportSummary {
  const title = raw.match(titleRegex)?.[1]?.trim() ?? path.basename(reportPath);
  const scoreRaw = raw.match(scoreRegex)?.[1]?.trim() ?? "";
  const score = Number.parseFloat(scoreRaw.match(scoreValueRegex)?.[1] ?? "0") || 0;
  const archetype =
    cleanCell(raw.match(archetypeTableRegex)?.[1] ?? raw.match(archetypeColonRegex)?.[1] ?? "");
  const tldr = truncate(
    cleanCell(raw.match(tldrTableRegex)?.[1] ?? raw.match(tldrColonRegex)?.[1] ?? ""),
  );
  const remote = cleanCell(raw.match(remoteRegex)?.[1] ?? "");
  const compEstimate = cleanCell(raw.match(compRegex)?.[1] ?? "");
  const url = raw.match(urlRegex)?.[1] ?? "";
  const legitimacy = raw.match(legitimacyRegex)?.[1]?.trim() ?? "";
  const pdf = raw.match(pdfRegex)?.[1]?.trim() ?? "";
  const reportId = path.basename(reportPath).slice(0, 3);

  return {
    reportId,
    reportPath,
    title,
    score,
    scoreRaw,
    archetype,
    tldr,
    remote,
    compEstimate,
    url,
    legitimacy,
    pdf,
  };
}
