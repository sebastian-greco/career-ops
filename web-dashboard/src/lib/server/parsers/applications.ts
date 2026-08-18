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
  let columnIndexes = {
    date: 1,
    company: 2,
    role: 3,
    score: 4,
    status: 5,
    pdf: 6,
    report: 7,
    notes: 8,
  };

  for (const sourceLine of raw.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (line.startsWith("| #")) {
      const headers = parseFields(line).map((header) => header.toLowerCase());
      const indexOf = (header: string, fallback: number) => {
        const index = headers.indexOf(header);
        return index === -1 ? fallback : index;
      };
      columnIndexes = {
        date: indexOf("date", columnIndexes.date),
        company: indexOf("company", columnIndexes.company),
        role: indexOf("role", columnIndexes.role),
        score: indexOf("score", columnIndexes.score),
        status: indexOf("status", columnIndexes.status),
        pdf: indexOf("pdf", columnIndexes.pdf),
        report: indexOf("report", columnIndexes.report),
        notes: indexOf("notes", columnIndexes.notes),
      };
      continue;
    }

    if (
      line === "" ||
      line.startsWith("# ") ||
      line.startsWith("|---") ||
      !line.startsWith("|")
    ) {
      continue;
    }

    const fields = parseFields(line);
    if (fields.length < 8) {
      continue;
    }

    number += 1;
    const scoreRaw = fields[columnIndexes.score] ?? "";
    const statusRaw = fields[columnIndexes.status] ?? "";
    const scoreMatch = scoreRaw.match(scoreRegex);
    const reportMatch = fields[columnIndexes.report]?.match(reportLinkRegex);

    applications.push({
      number,
      date: fields[columnIndexes.date] ?? "",
      company: fields[columnIndexes.company] ?? "",
      role: fields[columnIndexes.role] ?? "",
      statusRaw,
      statusNormalized: normalizeStatus(statusRaw),
      score: scoreMatch ? Number.parseFloat(scoreMatch[1]) : 0,
      scoreRaw,
      hasPdf: (fields[columnIndexes.pdf] ?? "").includes("✅"),
      reportNumber: reportMatch?.[1] ?? "",
      reportPath: reportMatch?.[2] ?? "",
      notes: fields[columnIndexes.notes] ?? "",
      jobUrl: "",
      compEstimate: "",
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
