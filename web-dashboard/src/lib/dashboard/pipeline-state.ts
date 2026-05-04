import type { DashboardApplication, PipelineFilter, PipelineSort, PipelineView, StatusOption } from "@/lib/dashboard/types";
import { statusPriority } from "@/lib/server/parsers/applications";

export const pipelineFilters: Array<{ value: PipelineFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "evaluated", label: "Evaluated" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "top", label: "Top >= 4" },
  { value: "skip", label: "Skip" },
];

export const pipelineSorts: PipelineSort[] = ["score", "date", "company", "status"];

export const pipelineGroupOrder = [
  "interview",
  "offer",
  "responded",
  "evaluated",
  "applied",
  "skip",
  "rejected",
  "discarded",
];

export function getApplicationId(application: DashboardApplication) {
  return application.reportNumber || `row-${application.number}`;
}

export function getFilteredApplications(applications: DashboardApplication[], filter: PipelineFilter) {
  switch (filter) {
    case "evaluated":
    case "applied":
    case "interview":
    case "skip":
    case "rejected":
      return applications.filter((application) => application.statusNormalized === filter);
    case "top":
      return applications.filter(
        (application) => application.score >= 4 && application.statusNormalized !== "skip",
      );
    case "all":
    default:
      return applications;
  }
}

export function coerceSearch(value?: string) {
  return value?.trim() ?? "";
}

export function searchApplications(applications: DashboardApplication[], search: string) {
  const normalizedSearch = coerceSearch(search).toLowerCase();

  if (!normalizedSearch) {
    return applications;
  }

  return applications.filter((application) => {
    const company = application.company.toLowerCase();
    const role = application.role.toLowerCase();

    return company.includes(normalizedSearch) || role.includes(normalizedSearch);
  });
}

export function sortApplications(applications: DashboardApplication[], sort: PipelineSort, view: PipelineView) {
  return [...applications].sort((left, right) => {
    if (view === "grouped") {
      const leftPriority = statusPriority(String(left.statusNormalized));
      const rightPriority = statusPriority(String(right.statusNormalized));
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
    }

    switch (sort) {
      case "date":
        return right.date.localeCompare(left.date);
      case "company":
        return left.company.localeCompare(right.company);
      case "status":
        return view === "grouped"
          ? right.score - left.score
          : statusPriority(String(left.statusNormalized)) - statusPriority(String(right.statusNormalized));
      case "score":
      default:
        return right.score - left.score;
    }
  });
}

export function statusLabel(statuses: StatusOption[], value: string) {
  return statuses.find((status) => status.id === value)?.label ?? value;
}

export function toPipelineSearchParams(
  filter: PipelineFilter,
  sort: PipelineSort,
  view: PipelineView,
  selectedId: string,
  search: string,
) {
  const params = new URLSearchParams();
  const normalizedSearch = coerceSearch(search);

  if (filter !== "applied") {
    params.set("filter", filter);
  }
  if (sort !== "score") {
    params.set("sort", sort);
  }
  if (view !== "grouped") {
    params.set("view", view);
  }
  if (normalizedSearch) {
    params.set("q", normalizedSearch);
  }
  if (selectedId) {
    params.set("selected", selectedId);
  }

  return params.toString();
}

export function coerceFilter(value?: string): PipelineFilter {
  if (
    value === "all" ||
    value === "evaluated" ||
    value === "applied" ||
    value === "interview" ||
    value === "rejected" ||
    value === "skip" ||
    value === "top"
  ) {
    return value;
  }

  return "applied";
}

export function coerceSort(value?: string): PipelineSort {
  if (value === "date" || value === "company" || value === "status") {
    return value;
  }

  return "score";
}

export function coerceView(value?: string): PipelineView {
  return value === "flat" ? "flat" : "grouped";
}
