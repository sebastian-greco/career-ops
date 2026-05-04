import type { DashboardApplication, StatusOption } from "@/lib/dashboard/types";

const reportLinkRegex = /\[(\d+)\]\(([^)]+)\)/;
const scoreRegex = /(\d+\.?\d*)\/5/;

function parseFields(line: string) {
  if (line.includes("\t")) {
    return line
      .replace(/^\|/, "")
      .trim()
      .split("\t")
      .map((part) => part.trim().replace(/^\||\|$/g, "").trim());
  }

  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((part) => part.trim());
}

export function parseApplicationsMarkdown(raw: string, normalizeStatus: (status: string) => string) {
  const applications: DashboardApplication[] = [];
  let number = 0;

  for (const sourceLine of raw.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (
      line === "" ||
      line.startsWith("# ") ||
      line.startsWith("|---") ||
      line.startsWith("| #") ||
      !line.startsWith("|")
    ) {
      continue;
    }

    const fields = parseFields(line);
    if (fields.length < 8) {
      continue;
    }

    number += 1;
    const scoreMatch = fields[4]?.match(scoreRegex);
    const reportMatch = fields[7]?.match(reportLinkRegex);

    applications.push({
      number,
      date: fields[1] ?? "",
      company: fields[2] ?? "",
      role: fields[3] ?? "",
      statusRaw: fields[5] ?? "",
      statusNormalized: normalizeStatus(fields[5] ?? ""),
      score: scoreMatch ? Number.parseFloat(scoreMatch[1]) : 0,
      scoreRaw: fields[4] ?? "",
      hasPdf: (fields[6] ?? "").includes("✅"),
      reportNumber: reportMatch?.[1] ?? "",
      reportPath: reportMatch?.[2] ?? "",
      notes: fields[8] ?? "",
      jobUrl: "",
    });
  }

  return applications;
}

export function countFilters(applications: DashboardApplication[]) {
  return {
    all: applications.length,
    evaluated: applications.filter((app) => app.statusNormalized === "evaluated").length,
    applied: applications.filter((app) => app.statusNormalized === "applied").length,
    interview: applications.filter((app) => app.statusNormalized === "interview").length,
    rejected: applications.filter((app) => app.statusNormalized === "rejected").length,
    skip: applications.filter((app) => app.statusNormalized === "skip").length,
    top: applications.filter(
      (app) => app.score >= 4 && app.statusNormalized !== "skip",
    ).length,
  };
}

export function statusPriority(status: string) {
  switch (status) {
    case "interview":
      return 0;
    case "offer":
      return 1;
    case "responded":
      return 2;
    case "evaluated":
      return 3;
    case "applied":
      return 4;
    case "skip":
      return 5;
    case "rejected":
      return 6;
    case "discarded":
      return 7;
    default:
      return 8;
  }
}

export function getStatusLabels(statuses: StatusOption[]) {
  return new Map(statuses.map((status) => [status.id, status.label]));
}
