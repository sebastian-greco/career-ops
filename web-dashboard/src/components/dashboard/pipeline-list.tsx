"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

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
import {
  coerceSearch,
  getApplicationId,
  getFilteredApplications,
  pipelineFilters,
  searchApplications,
  sortApplications,
  statusLabel,
  toPipelineSearchParams,
} from "@/lib/dashboard/pipeline-state";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

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
  const sorts: PipelineSort[] = ["score", "date", "company", "status"];
  const currentIndex = sorts.indexOf(current);
  return sorts[(currentIndex + 1) % sorts.length] ?? "score";
}

function nextFilter(current: PipelineFilter, direction: 1 | -1) {
  const currentIndex = pipelineFilters.findIndex((filter) => filter.value === current);
  const nextIndex = (currentIndex + direction + pipelineFilters.length) % pipelineFilters.length;
  return pipelineFilters[nextIndex]?.value ?? "applied";
}

function groupCount(applications: DashboardApplication[], status: string) {
  return applications.filter((application) => application.statusNormalized === status).length;
}

interface PipelineListProps {
  initialSnapshot: PipelineSnapshot;
  initialFilter: PipelineFilter;
  initialSort: PipelineSort;
  initialView: PipelineView;
  initialSearch: string;
  initialSelectedReportId?: string;
}

export function PipelineList({
  initialSnapshot,
  initialFilter,
  initialSort,
  initialView,
  initialSearch,
  initialSelectedReportId,
}: PipelineListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasExplicitFilter = searchParams.has("filter");
  const utils = trpc.useUtils();
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<PipelineFilter>(() => {
    if (hasExplicitFilter || typeof window === "undefined") {
      return initialFilter;
    }

    const savedFilter = window.localStorage.getItem("career-ops-pipeline-filter");
    if (savedFilter && pipelineFilters.some((filter) => filter.value === savedFilter)) {
      return savedFilter as PipelineFilter;
    }

    return initialFilter;
  });
  const [activeSort, setActiveSort] = useState<PipelineSort>(initialSort);
  const [activeView, setActiveView] = useState<PipelineView>(initialView);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("career-ops-pipeline-filter", activeFilter);
  }, [activeFilter]);

  const snapshotQuery = trpc.pipeline.snapshot.useQuery(undefined, {
    initialData: initialSnapshot,
    refetchOnWindowFocus: false,
  });

  const snapshot = snapshotQuery.data;
  const normalizedSearch = coerceSearch(activeSearch);

  const filtered = useMemo(
    () =>
      sortApplications(
        searchApplications(getFilteredApplications(snapshot.applications, activeFilter), normalizedSearch),
        activeSort,
        activeView,
      ),
    [activeFilter, activeSort, activeView, normalizedSearch, snapshot.applications],
  );

  const selected = filtered.find((application) => getApplicationId(application) === selectedApplicationId) ?? filtered[0];
  const currentStatusLabel = selected
    ? snapshot.statuses.find((status) => status.id === selected.statusNormalized)?.label ?? selected.statusRaw
    : "";
  const selectedStateId = selected ? getApplicationId(selected) : "";
  const pipelineQuery = toPipelineSearchParams(activeFilter, activeSort, activeView, selectedStateId, normalizedSearch);
  const pipelineHref = pipelineQuery ? `${pathname}?${pipelineQuery}` : pathname;

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedApplicationId, activeFilter, activeSort, activeView, normalizedSearch]);

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const nextQuery = toPipelineSearchParams(activeFilter, activeSort, activeView, selectedStateId, normalizedSearch);
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [activeFilter, activeSort, activeView, normalizedSearch, pathname, router, searchParams, selectedStateId]);

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

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
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
            normalizedSearch,
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
          selected ? getApplicationId(selected) : "",
          normalizedSearch,
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
    normalizedSearch,
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Pipeline</CardTitle>
                <CardDescription>Interactive parity layer over the existing filesystem tracker.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching}>
                <RefreshIcon className={cn("size-4", snapshotQuery.isFetching && "animate-spin")} />
                <span className="sr-only">Refresh pipeline</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {pipelineFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      activeFilter === filter.value
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border/80 bg-accent/55 text-accent-foreground/80 hover:border-secondary/60 hover:bg-secondary hover:text-secondary-foreground",
                    )}
                  >
                    {filter.label} ({snapshot.filterCounts[filter.value]})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="min-w-[15rem] flex-1">
                  <span className="sr-only">Search pipeline</span>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={activeSearch}
                    onChange={(event) => setActiveSearch(event.target.value)}
                    placeholder="Search company or role"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </label>
                {normalizedSearch ? (
                  <Button variant="ghost" size="sm" onClick={() => setActiveSearch("")}>
                    Clear
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveView((current) => (current === "grouped" ? "flat" : "grouped"))}
                >
                  View: {activeView}
                </Button>
                <div className="text-xs text-muted-foreground">
                  {filtered.length} match{filtered.length === 1 ? "" : "es"}
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  Shortcuts: j/k move, h/l tabs, / search, s sort, v view, c status, Enter report, o url, p progress
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="max-h-[36rem] overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-muted/50 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">
                          <SortHeader label="Score" active={activeSort === "score"} onClick={() => setActiveSort("score")} />
                        </th>
                        <th className="px-4 py-3">
                          <SortHeader label="Company" active={activeSort === "company"} onClick={() => setActiveSort("company")} />
                        </th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">
                          <SortHeader label="Status" active={activeSort === "status"} onClick={() => setActiveSort("status")} />
                        </th>
                        <th className="px-4 py-3">Comp</th>
                        <th className="px-4 py-3">
                          <SortHeader label="Date" active={activeSort === "date"} onClick={() => setActiveSort("date")} />
                        </th>
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
                            onOpen={() => {
                              if (!application.reportNumber) {
                                return;
                              }

                              startTransition(() =>
                                router.push(
                                  `/reports/${application.reportNumber}${pipelineQuery ? `?back=${encodeURIComponent(pipelineHref)}` : ""}`,
                                ),
                              );
                            }}
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
                      <Button variant="secondary">Open Job URL</Button>
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
                      variant="secondary"
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
  onOpen,
  rowRef,
  compEstimate,
}: {
  application: DashboardApplication;
  isSelected: boolean;
  showGroupHeader: boolean;
  statuses: StatusOption[];
  groupCount: number;
  onSelect: () => void;
  onOpen: () => void;
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
        onDoubleClick={onOpen}
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

function SortHeader({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 font-semibold uppercase tracking-[0.14em] transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("text-[10px]", active ? "text-primary" : "text-muted-foreground/70")}>+</span>
    </button>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
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
