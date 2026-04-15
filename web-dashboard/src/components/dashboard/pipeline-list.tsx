"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { MetricChip } from "@/components/dashboard/metric-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardApplication,
  PipelineFilter,
  PipelineSnapshot,
  PipelineSort,
  PipelineView,
  ReportSummary,
  StatusOption,
} from "@/lib/dashboard/types";
import { statusPriority } from "@/lib/server/parsers/applications";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const filters: Array<{ value: PipelineFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "evaluated", label: "Evaluated" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "top", label: "Top >= 4" },
  { value: "skip", label: "Skip" },
];

const sorts: PipelineSort[] = ["score", "date", "company", "status"];
const groupOrder = [
  "interview",
  "offer",
  "responded",
  "applied",
  "evaluated",
  "skip",
  "rejected",
  "discarded",
];

function getFilteredApplications(applications: DashboardApplication[], filter: PipelineFilter) {
  switch (filter) {
    case "evaluated":
    case "applied":
    case "interview":
    case "skip":
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

function sortApplications(applications: DashboardApplication[], sort: PipelineSort, view: PipelineView) {
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

function statusLabel(statuses: StatusOption[], value: string) {
  return statuses.find((status) => status.id === value)?.label ?? value;
}

function scoreTone(score: number) {
  if (score >= 4.2) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 3.8) {
    return "text-amber-600 dark:text-amber-400";
  }
  if (score >= 3) {
    return "text-foreground";
  }
  return "text-rose-600 dark:text-rose-400";
}

function truncateComp(compEstimate: string, max = 72) {
  if (compEstimate.length <= max) {
    return compEstimate;
  }

  return `${compEstimate.slice(0, max - 3)}...`;
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    : false;
}

function cycleSort(current: PipelineSort) {
  const currentIndex = sorts.indexOf(current);
  return sorts[(currentIndex + 1) % sorts.length] ?? "score";
}

function nextFilter(current: PipelineFilter, direction: 1 | -1) {
  const currentIndex = filters.findIndex((filter) => filter.value === current);
  const nextIndex = (currentIndex + direction + filters.length) % filters.length;
  return filters[nextIndex]?.value ?? "all";
}

function groupCount(applications: DashboardApplication[], status: string) {
  return applications.filter((application) => application.statusNormalized === status).length;
}

function getApplicationId(application: DashboardApplication) {
  return application.reportNumber || `row-${application.number}`;
}

function toPipelineSearchParams(filter: PipelineFilter, sort: PipelineSort, view: PipelineView, selectedId: string) {
  const params = new URLSearchParams();

  if (filter !== "all") {
    params.set("filter", filter);
  }
  if (sort !== "score") {
    params.set("sort", sort);
  }
  if (view !== "grouped") {
    params.set("view", view);
  }
  if (selectedId) {
    params.set("selected", selectedId);
  }

  return params.toString();
}

interface PipelineListProps {
  initialSnapshot: PipelineSnapshot;
  initialFilter: PipelineFilter;
  initialSort: PipelineSort;
  initialView: PipelineView;
  initialSelectedReportId?: string;
}

export function PipelineList({
  initialSnapshot,
  initialFilter,
  initialSort,
  initialView,
  initialSelectedReportId,
}: PipelineListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<PipelineFilter>(initialFilter);
  const [activeSort, setActiveSort] = useState<PipelineSort>(initialSort);
  const [activeView, setActiveView] = useState<PipelineView>(initialView);
  const [selectedApplicationId, setSelectedApplicationId] = useState(() => {
    if (initialSelectedReportId) {
      const matchingApplication = initialSnapshot.applications.find(
        (application) => application.reportNumber === initialSelectedReportId,
      );
      if (matchingApplication) {
        return getApplicationId(matchingApplication);
      }
    }

    return initialSnapshot.applications[0] ? getApplicationId(initialSnapshot.applications[0]) : "";
  });
  const [statusMode, setStatusMode] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");

  const snapshotQuery = trpc.pipeline.snapshot.useQuery(undefined, {
    initialData: initialSnapshot,
    refetchOnWindowFocus: false,
  });

  const snapshot = snapshotQuery.data;

  const filtered = useMemo(
    () => sortApplications(getFilteredApplications(snapshot.applications, activeFilter), activeSort, activeView),
    [activeFilter, activeSort, activeView, snapshot.applications],
  );

  const selected = filtered.find((application) => getApplicationId(application) === selectedApplicationId) ?? filtered[0];
  const currentStatusLabel = selected
    ? snapshot.statuses.find((status) => status.id === selected.statusNormalized)?.label ?? selected.statusRaw
    : "";
  const selectedStateId = selected ? getApplicationId(selected) : selectedApplicationId;
  const pipelineQuery = toPipelineSearchParams(activeFilter, activeSort, activeView, selectedStateId);
  const pipelineHref = pipelineQuery ? `${pathname}?${pipelineQuery}` : pathname;

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedApplicationId, activeFilter, activeSort, activeView]);

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const nextQuery = toPipelineSearchParams(activeFilter, activeSort, activeView, selectedStateId);
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [activeFilter, activeSort, activeView, pathname, router, searchParams, selectedStateId]);

  const summaryQuery = trpc.reports.summary.useQuery(
    { reportId: selected?.reportNumber ?? "" },
    {
      enabled: Boolean(selected?.reportNumber),
      refetchOnWindowFocus: false,
    },
  );

  const updateStatusMutation = trpc.pipeline.updateStatus.useMutation({
    onSuccess(nextSnapshot) {
      utils.pipeline.snapshot.setData(undefined, nextSnapshot);
      utils.progress.snapshot.invalidate();
      if (selected?.reportNumber) {
        utils.reports.summary.invalidate({ reportId: selected.reportNumber });
      }
      setStatusMode(false);
    },
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || event.metaKey || event.altKey) {
        return;
      }

      if (!selected && filtered.length === 0) {
        return;
      }

      if (statusMode) {
        if (event.key === "Escape" || event.key.toLowerCase() === "q") {
          event.preventDefault();
          setStatusMode(false);
          setPendingStatus("");
          return;
        }

        if (event.key === "ArrowDown" || event.key === "j") {
          event.preventDefault();
          const currentIndex = snapshot.statuses.findIndex((status) => status.label === pendingStatus);
          const nextIndex = Math.min(currentIndex + 1, snapshot.statuses.length - 1);
          setPendingStatus(snapshot.statuses[nextIndex]?.label ?? pendingStatus);
          return;
        }

        if (event.key === "ArrowUp" || event.key === "k") {
          event.preventDefault();
          const currentIndex = snapshot.statuses.findIndex((status) => status.label === pendingStatus);
          const nextIndex = Math.max(currentIndex - 1, 0);
          setPendingStatus(snapshot.statuses[nextIndex]?.label ?? pendingStatus);
          return;
        }

        if (event.key === "Enter" && selected?.reportNumber && pendingStatus) {
          event.preventDefault();
          updateStatusMutation.mutate({ reportId: selected.reportNumber, newStatus: pendingStatus });
        }

        return;
      }

      const currentIndex = filtered.findIndex(
        (application) => selected && getApplicationId(application) === getApplicationId(selected),
      );
      const halfPage = Math.max(Math.floor(window.innerHeight / 140), 1);

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        const next = filtered[Math.min(currentIndex + 1, filtered.length - 1)];
        if (next) {
          setSelectedApplicationId(getApplicationId(next));
        }
        return;
      }

      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        const next = filtered[Math.max(currentIndex - 1, 0)];
        if (next) {
          setSelectedApplicationId(getApplicationId(next));
        }
        return;
      }

      if (event.key === "ArrowRight" || event.key === "l") {
        event.preventDefault();
        setActiveFilter((current) => nextFilter(current, 1));
        setStatusMode(false);
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "h") {
        event.preventDefault();
        setActiveFilter((current) => nextFilter(current, -1));
        setStatusMode(false);
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        setActiveSort((current) => cycleSort(current));
        setStatusMode(false);
        return;
      }

      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        setActiveView((current) => (current === "grouped" ? "flat" : "grouped"));
        setStatusMode(false);
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        snapshotQuery.refetch();
        return;
      }

      if (event.key.toLowerCase() === "c" && selected) {
        event.preventDefault();
        setPendingStatus(currentStatusLabel);
        setStatusMode(true);
        return;
      }

      if (event.key === "Enter" && selected) {
        event.preventDefault();
        if (selected.reportNumber) {
          const nextQuery = toPipelineSearchParams(
            activeFilter,
            activeSort,
            activeView,
            getApplicationId(selected),
          );
          const nextPipelineHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
          startTransition(() =>
            router.push(`/reports/${selected.reportNumber}${nextQuery ? `?back=${encodeURIComponent(nextPipelineHref)}` : ""}`),
          );
        }
        return;
      }

      if (event.key.toLowerCase() === "o" && selected?.jobUrl) {
        event.preventDefault();
        window.open(selected.jobUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        const nextQuery = toPipelineSearchParams(
          activeFilter,
          activeSort,
          activeView,
          selected ? getApplicationId(selected) : selectedApplicationId,
        );
        const nextPipelineHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        startTransition(() =>
          router.push(`/progress${nextQuery ? `?back=${encodeURIComponent(nextPipelineHref)}` : ""}`),
        );
        return;
      }

      if (event.key === "PageDown" || (event.ctrlKey && event.key.toLowerCase() === "d")) {
        event.preventDefault();
        const next = filtered[Math.min(currentIndex + halfPage, filtered.length - 1)];
        if (next) {
          setSelectedApplicationId(getApplicationId(next));
        }
        return;
      }

      if (event.key === "PageUp" || (event.ctrlKey && event.key.toLowerCase() === "u")) {
        event.preventDefault();
        const next = filtered[Math.max(currentIndex - halfPage, 0)];
        if (next) {
          setSelectedApplicationId(getApplicationId(next));
        }
        return;
      }

      if (event.key === "g" && !event.shiftKey) {
        event.preventDefault();
        setSelectedApplicationId(filtered[0] ? getApplicationId(filtered[0]) : "");
        setStatusMode(false);
        return;
      }

      if (event.key.toLowerCase() === "g" && event.shiftKey) {
        event.preventDefault();
        setSelectedApplicationId(filtered[filtered.length - 1] ? getApplicationId(filtered[filtered.length - 1]) : "");
        setStatusMode(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeFilter,
    activeSort,
    activeView,
    filtered,
    pendingStatus,
    pathname,
    router,
    selected,
    selectedApplicationId,
    currentStatusLabel,
    snapshot.statuses,
    snapshotQuery,
    statusMode,
    updateStatusMutation,
  ]);

  const selectedSummary: ReportSummary | null | undefined = summaryQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricChip label="Offers" value={String(snapshot.metrics.total)} hint="Tracker rows" />
        <MetricChip
          label="Average"
          value={`${snapshot.metrics.avgScore.toFixed(1)}/5`}
          hint={`Top ${snapshot.metrics.topScore.toFixed(1)}/5`}
        />
        <MetricChip label="With PDF" value={String(snapshot.metrics.withPdf)} hint="Generated CVs" />
        <MetricChip label="Actionable" value={String(snapshot.metrics.actionable)} hint="Still in funnel" />
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {groupOrder
            .filter((status) => (snapshot.metrics.byStatus[status as keyof typeof snapshot.metrics.byStatus] ?? 0) > 0)
            .map((status) => (
              <span key={status} className="rounded-full border border-border px-3 py-1">
                {statusLabel(snapshot.statuses, status)}:{" "}
                {snapshot.metrics.byStatus[status as keyof typeof snapshot.metrics.byStatus] ?? 0}
              </span>
            ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
              <CardDescription>Interactive parity layer over the existing filesystem tracker.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      activeFilter === filter.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {filter.label} ({snapshot.filterCounts[filter.value]})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveSort(cycleSort(activeSort))}>
                  Sort: {activeSort}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveView((current) => (current === "grouped" ? "flat" : "grouped"))}
                >
                  View: {activeView}
                </Button>
                <Button variant="outline" size="sm" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
                  {snapshotQuery.isFetching ? "Refreshing..." : "Refresh"}
                </Button>
                <div className="ml-auto text-xs text-muted-foreground">
                  Shortcuts: j/k move, h/l tabs, s sort, v view, c status, Enter report, o url, p progress
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="max-h-[36rem] overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Comp</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No offers match this filter.
                          </td>
                        </tr>
                      ) : null}
                      {filtered.map((application, index) => {
                        const showGroupHeader =
                          activeView === "grouped" &&
                          (index === 0 || filtered[index - 1]?.statusNormalized !== application.statusNormalized);

                        return (
                          <FragmentRow
                            key={getApplicationId(application)}
                            application={application}
                            isSelected={selected ? getApplicationId(selected) === getApplicationId(application) : false}
                            showGroupHeader={showGroupHeader}
                            statuses={snapshot.statuses}
                            groupCount={groupCount(filtered, String(application.statusNormalized))}
                            onSelect={() => setSelectedApplicationId(getApplicationId(application))}
                            rowRef={selected && getApplicationId(selected) === getApplicationId(application) ? selectedRowRef : undefined}
                            compEstimate={truncateComp(snapshot.summariesByReportId[application.reportNumber]?.compEstimate ?? "")}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-8">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {selected ? `${selected.company} · ${selected.role}` : "No tracker row matches the current filter."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="space-y-3 text-sm">
                  <PreviewField label="Archetype" value={selectedSummary?.archetype || "Not found"} />
                  <PreviewField
                    label="TL;DR"
                    value={summaryQuery.isLoading ? "Loading preview..." : selectedSummary?.tldr || selected.notes || "No summary yet"}
                  />
                  <PreviewField label="Remote" value={selectedSummary?.remote || "Not found"} />
                  <PreviewField label="Comp" value={selectedSummary?.compEstimate || "Not found"} />
                  <PreviewField label="Status" value={statusLabel(snapshot.statuses, String(selected.statusNormalized))} />
                  <PreviewField label="Report" value={selected.reportPath || "Missing report path"} mono />
                  <PreviewField label="Notes" value={selected.notes || "No notes"} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.reportNumber ? (
                    <Link href={`/reports/${selected.reportNumber}${pipelineQuery ? `?back=${encodeURIComponent(pipelineHref)}` : ""}`}>
                      <Button>Open Report</Button>
                    </Link>
                  ) : (
                    <Button disabled>No Report</Button>
                  )}
                  {selected.jobUrl ? (
                    <a href={selected.jobUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline">Open Job URL</Button>
                    </a>
                  ) : null}
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-muted-foreground">
                        Press <span className="font-semibold text-foreground">c</span> to enter keyboard status mode.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatusMode((current) => !current)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {statusMode ? "Close" : "Edit"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={statusMode ? pendingStatus || currentStatusLabel : currentStatusLabel}
                      onChange={(event) => setPendingStatus(event.target.value)}
                      className={cn(
                        "min-w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                        statusMode && "ring-1 ring-ring",
                      )}
                    >
                      {snapshot.statuses.map((status) => (
                        <option key={status.id} value={status.label}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() =>
                        selected.reportNumber
                          ? updateStatusMutation.mutate({ reportId: selected.reportNumber, newStatus: pendingStatus })
                          : undefined
                      }
                      disabled={updateStatusMutation.isPending || !pendingStatus}
                    >
                      {updateStatusMutation.isPending ? "Updating..." : "Update status"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Adjust the filter to inspect another slice.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FragmentRow({
  application,
  isSelected,
  showGroupHeader,
  statuses,
  groupCount,
  onSelect,
  rowRef,
  compEstimate,
}: {
  application: DashboardApplication;
  isSelected: boolean;
  showGroupHeader: boolean;
  statuses: StatusOption[];
  groupCount: number;
  onSelect: () => void;
  rowRef?: React.RefObject<HTMLTableRowElement | null>;
  compEstimate: string;
}) {
  return (
    <>
      {showGroupHeader ? (
        <tr className="bg-muted/40">
          <td colSpan={6} className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {statusLabel(statuses, String(application.statusNormalized))} ({groupCount})
          </td>
        </tr>
      ) : null}
      <tr
        ref={rowRef ?? undefined}
        onClick={onSelect}
        aria-selected={isSelected}
        className={cn(
          "cursor-pointer border-t border-border transition-colors",
          isSelected ? "bg-muted/60" : "hover:bg-muted/30",
        )}
      >
        <td className={cn("px-4 py-3 font-semibold", scoreTone(application.score))}>{application.score.toFixed(1)}</td>
        <td className="px-4 py-3 font-medium">{application.company}</td>
        <td className="px-4 py-3 text-muted-foreground">{application.role}</td>
        <td className="px-4 py-3 text-muted-foreground">
          {statusLabel(statuses, String(application.statusNormalized))}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{compEstimate || "-"}</td>
        <td className="px-4 py-3 text-muted-foreground">{application.date}</td>
      </tr>
    </>
  );
}

function PreviewField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-foreground", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}
