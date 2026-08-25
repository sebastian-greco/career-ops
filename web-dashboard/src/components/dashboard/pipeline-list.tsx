import type { DashboardApplication, PipelineFilter, PipelineSnapshot, PipelineSort, PipelineView, StatusOption } from "@/lib/dashboard/types";
import { getApplicationId, getFilteredApplications, pipelineFilters, searchApplications, sortApplications, statusLabel, toPipelineSearchParams } from "@/lib/dashboard/pipeline-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 40;
const desktopGrid = "lg:grid-cols-[4rem_minmax(8rem,1fr)_minmax(12rem,2fr)_minmax(12rem,1.35fr)_minmax(7rem,1fr)_6.5rem_2.5rem]";

function scoreTone(score: number) {
  if (score >= 4.2) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 3.8) return "text-amber-700 dark:text-amber-400";
  if (score >= 3) return "text-foreground";
  return "text-rose-700 dark:text-rose-400";
}

function statusTone(status: string) {
  switch (status) {
    case "offer":
    case "interview": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    case "responded":
    case "applied": return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "rejected":
    case "discarded": return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
    case "skip": return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    default: return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
}

function truncate(value: string, max = 72) {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

interface PipelineListProps {
  initialSnapshot: PipelineSnapshot;
  initialFilter: PipelineFilter;
  initialSort: PipelineSort;
  initialView: PipelineView;
  initialSearch: string;
  initialPage?: number;
  initialSelectedReportId?: string;
  initialHasExplicitFilter: boolean;
}

interface PipelineLocation {
  filter: PipelineFilter;
  sort: PipelineSort;
  view: PipelineView;
  search: string;
  page: number;
  selected?: string;
}

function pipelineHref(location: PipelineLocation) {
  const query = toPipelineSearchParams(location.filter, location.sort, location.view, location.selected ?? "", location.search, location.page);
  return query ? `/pipeline?${query}` : "/pipeline";
}

function reportHref(application: DashboardApplication, location: PipelineLocation) {
  if (!application.reportNumber) return "#";
  const back = pipelineHref({ ...location, selected: getApplicationId(application) });
  return `/reports/${application.reportNumber}?back=${encodeURIComponent(back)}`;
}

export function PipelineList({ initialSnapshot: snapshot, initialFilter, initialSort, initialView, initialSearch, initialPage = 1, initialSelectedReportId }: PipelineListProps) {
  const filtered = sortApplications(searchApplications(getFilteredApplications(snapshot.applications, initialFilter), initialSearch), initialSort, initialView);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(initialPage, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const location: PipelineLocation = { filter: initialFilter, sort: initialSort, view: initialView, search: initialSearch, page: currentPage, selected: initialSelectedReportId };
  const currentHref = pipelineHref(location);
  const groupCounts = new Map<string, number>();
  for (const application of filtered) {
    const status = String(application.statusNormalized);
    groupCounts.set(status, (groupCounts.get(status) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-4 sm:px-5">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Job search</p><h2 className="mt-0.5 text-xl font-bold tracking-tight">Pipeline</h2></div>
          <a href={currentHref} className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent" aria-label="Refresh pipeline"><RefreshIcon className="size-5" /></a>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <nav aria-label="Pipeline filters" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {pipelineFilters.map((filter) => (
              <a key={filter.value} href={pipelineHref({ ...location, filter: filter.value, page: 1, selected: "" })} aria-current={initialFilter === filter.value ? "page" : undefined} className={cn("flex min-h-11 shrink-0 snap-start items-center rounded-full border px-4 text-sm font-semibold transition-colors active:scale-[0.98]", initialFilter === filter.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground")}>
                {filter.label} <span className="ml-1 opacity-70">{snapshot.filterCounts[filter.value]}</span>
              </a>
            ))}
          </nav>

          <form action="/pipeline" method="get" className="grid gap-2 sm:grid-cols-[minmax(16rem,1fr)_auto_auto_auto]">
            <input type="hidden" name="filter" value={initialFilter} />
            <input type="hidden" name="view" value={initialView} />
            <label className="relative block"><span className="sr-only">Search company or role</span><SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input name="q" type="search" defaultValue={initialSearch} placeholder="Search company or role" className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:h-11 sm:text-sm" /></label>
            <label className="relative"><span className="sr-only">Sort applications</span><select name="sort" defaultValue={initialSort} className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-9 text-base font-medium sm:h-11 sm:w-auto sm:text-sm"><option value="score">Sort: Score</option><option value="date">Sort: Newest</option><option value="company">Sort: Company</option><option value="status">Sort: Status</option></select><ChevronIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
            <button type="submit" className="h-12 rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors active:bg-secondary/80 sm:h-11">Apply</button>
            <a href={pipelineHref({ ...location, view: initialView === "grouped" ? "flat" : "grouped", page: 1, selected: "" })} className="flex h-12 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-bold transition-colors active:bg-accent sm:h-11">{initialView === "grouped" ? "Grouped" : "Flat list"}</a>
          </form>
          <p className="text-sm text-muted-foreground">{filtered.length === 0 ? "No positions" : `Showing ${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filtered.length)} of ${filtered.length} positions`}</p>
        </div>
      </section>

      {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center"><p className="font-semibold">No positions found</p><p className="mt-1 text-sm text-muted-foreground">Try another filter or clear your search.</p></div> : null}

      {visible.length > 0 ? (
        <section aria-label="Pipeline positions" className="space-y-3 lg:space-y-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:shadow-sm">
          <div className={cn("hidden bg-muted px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground lg:grid", desktopGrid)}>
            <SortHeader label="Score" active={initialSort === "score"} href={pipelineHref({ ...location, sort: "score", page: 1 })} />
            <SortHeader label="Company" active={initialSort === "company"} href={pipelineHref({ ...location, sort: "company", page: 1 })} />
            <span>Role</span>
            <SortHeader label="Status" active={initialSort === "status"} href={pipelineHref({ ...location, sort: "status", page: 1 })} />
            <span>Comp</span>
            <SortHeader label="Date" active={initialSort === "date"} href={pipelineHref({ ...location, sort: "date", page: 1 })} />
            <span className="sr-only">Open</span>
          </div>
          {visible.map((application, index) => {
            const previous = visible[index - 1];
            const showGroupHeader = initialView === "grouped" && (!previous || previous.statusNormalized !== application.statusNormalized);
            return <div key={getApplicationId(application)}>{showGroupHeader ? <GroupHeader application={application} statuses={snapshot.statuses} count={groupCounts.get(String(application.statusNormalized)) ?? 0} continued={pageStart > 0 && index === 0} /> : null}<ApplicationItem application={application} href={reportHref(application, location)} statuses={snapshot.statuses} backHref={currentHref} /></div>;
          })}
          <div className="hidden border-t border-border px-4 py-2 text-xs text-muted-foreground lg:block">Tap a company or role to read its report. Change a status and save it in the same row.</div>
        </section>
      ) : null}

      {pageCount > 1 ? <Pagination location={location} currentPage={currentPage} pageCount={pageCount} /> : null}
    </div>
  );
}

function GroupHeader({ application, statuses, count, continued }: { application: DashboardApplication; statuses: StatusOption[]; count: number; continued: boolean }) {
  return <div className="mb-2 mt-5 flex items-center gap-2 px-1 first:mt-0 lg:m-0 lg:border-t lg:border-border lg:bg-muted/70 lg:px-4 lg:py-2"><span className={cn("size-2 rounded-full", statusTone(String(application.statusNormalized)))} /><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{statusLabel(statuses, String(application.statusNormalized))} · {count}{continued ? " · continued" : ""}</p></div>;
}

function StatusForm({ application, statuses, backHref }: { application: DashboardApplication; statuses: StatusOption[]; backHref: string }) {
  const currentStatus = statusLabel(statuses, String(application.statusNormalized));
  return (
    <form action="/api/status" method="post" className="col-span-2 flex min-w-0 items-center gap-2 border-t border-border/60 pt-3 lg:col-span-1 lg:border-0 lg:p-0 lg:pr-3">
      <input type="hidden" name="reportId" value={application.reportNumber} /><input type="hidden" name="back" value={backHref} /><input type="hidden" name="token" value={process.env.DASHBOARD_WRITE_TOKEN ?? ""} />
      <label className="text-sm font-semibold lg:sr-only" htmlFor={`status-${getApplicationId(application)}`}>Status <span className="sr-only">for {application.company}</span></label>
      <div className="relative min-w-0 flex-1"><select id={`status-${getApplicationId(application)}`} name="newStatus" defaultValue={currentStatus} disabled={!application.reportNumber} className={cn("h-11 w-full appearance-none rounded-xl border border-input px-3 pr-8 text-base font-semibold disabled:opacity-60 lg:h-10 lg:border-0 lg:text-sm", statusTone(String(application.statusNormalized)))}>
        {statuses.map((status) => <option key={status.id} value={status.label}>{status.label}</option>)}
      </select><ChevronIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>
      <button type="submit" disabled={!application.reportNumber} className="h-11 shrink-0 rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground disabled:opacity-50 lg:h-10 lg:px-3 lg:text-xs">Save</button>
    </form>
  );
}

function ApplicationItem({ application, href, statuses, backHref }: { application: DashboardApplication; href: string; statuses: StatusOption[]; backHref: string }) {
  const canOpen = Boolean(application.reportNumber);
  return (
    <article className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm lg:grid lg:rounded-none lg:border-0 lg:border-t lg:border-border/70 lg:px-4 lg:py-3 lg:shadow-none", desktopGrid)}>
      <div className={cn("col-start-2 row-start-1 text-xl font-bold tabular-nums lg:col-auto lg:row-auto lg:self-center lg:text-base", scoreTone(application.score))}>{application.score.toFixed(1)}</div>
      <div className="min-w-0 lg:self-center lg:pr-3">{canOpen ? <a className="block truncate text-lg font-bold tracking-tight underline-offset-4 hover:underline lg:text-sm" href={href}>{application.company}</a> : <span className="block truncate text-lg font-bold tracking-tight lg:text-sm">{application.company}</span>}</div>
      <div className="col-span-2 min-w-0 text-base leading-snug text-muted-foreground lg:col-span-1 lg:self-center lg:pr-3 lg:text-sm">{canOpen ? <a className="block underline-offset-4 hover:text-foreground hover:underline lg:truncate" href={href}>{application.role}</a> : application.role}</div>
      <StatusForm application={application} statuses={statuses} backHref={backHref} />
      <div className="col-span-2 min-w-0 text-sm text-muted-foreground lg:col-span-1 lg:self-center lg:truncate lg:pr-3"><span className="font-semibold text-foreground lg:sr-only">Comp: </span>{truncate(application.compEstimate, 48) || "—"}{application.hasPdf ? <span className="ml-3 lg:sr-only">CV ready</span> : null}</div>
      <time className="self-center text-sm text-muted-foreground lg:text-xs" dateTime={application.date}>{application.date}</time>
      {canOpen ? <a href={href} aria-label={`Open report for ${application.company}`} className="flex size-11 items-center justify-center justify-self-end rounded-lg text-muted-foreground hover:bg-accent lg:size-10"><ChevronRightIcon className="size-5" /></a> : <span />}
    </article>
  );
}

function Pagination({ location, currentPage, pageCount }: { location: PipelineLocation; currentPage: number; pageCount: number }) {
  return (
    <nav aria-label="Pipeline pages" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
      {currentPage > 1 ? <a className="flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-bold hover:bg-accent" href={pipelineHref({ ...location, page: currentPage - 1, selected: "" })}>Previous</a> : <span className="min-h-11 px-4" />}
      <span className="text-sm font-semibold text-muted-foreground">Page {currentPage} of {pageCount}</span>
      {currentPage < pageCount ? <a className="flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-bold hover:bg-accent" href={pipelineHref({ ...location, page: currentPage + 1, selected: "" })}>Next</a> : <span className="min-h-11 px-4" />}
    </nav>
  );
}

function SortHeader({ label, active, href }: { label: string; active: boolean; href: string }) {
  return <a href={href} className={cn("font-bold uppercase tracking-[0.12em]", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>{label}{active ? " ↓" : ""}</a>;
}

function RefreshIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>; }
function SearchIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
function ChevronIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7 10 5 5 5-5" /></svg>; }
function ChevronRightIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>; }
