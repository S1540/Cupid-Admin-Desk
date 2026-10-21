
import { ui } from "@/lib/ui";
import { CalendarDays, SlidersHorizontal, RotateCcw, ArrowRight } from "lucide-react";
import { DATE_OPTIONS } from "@/lib/analytics";
export default function FilterBar({ draft, setDraft, onApply, onReset, loading, error, dirty, statuses }) {
  return <form className={ui("filter-bar")} onSubmit={onApply}>
    <div className={ui("filter-title")}><SlidersHorizontal size={15} /><span>Filters</span></div>
    <label className={ui("filter-field")}><CalendarDays size={15} /><span className={ui("sr-only")}>Date range</span><select aria-label="Date range" value={draft.range} onChange={e => setDraft({ ...draft, range: e.target.value })}>{DATE_OPTIONS.map(option => <option key={option}>{option}</option>)}</select></label>
    <label className={ui("filter-field")}><span className={ui("filter-prefix")}>Customers</span><select aria-label="Customer email verification, affects customer analytics only" value={draft.verification} onChange={e => setDraft({ ...draft, verification: e.target.value })}><option value="all">All customers</option><option value="verified">Email verified</option><option value="unverified">Email unverified</option></select></label>
    {(statuses.length > 0 || draft.status !== "all") && <label className={ui("filter-field")}><select aria-label="Order status, affects order analytics only" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="all">All order statuses</option>{[...new Set([...statuses, ...(draft.status === "all" ? [] : [draft.status])])].map(status => <option key={status} value={status}>{status}</option>)}</select></label>}
    {draft.range === "Custom range" && <div className={ui("custom-dates")}><input aria-label="Start date" type="date" required value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} /><ArrowRight size={14} /><input aria-label="End date" type="date" required min={draft.start} value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} /></div>}
    <label className={ui("filter-field compare-filter")}><select aria-label="Compare with" value={draft.range === "All time" ? "off" : draft.compare ? "previous" : "off"} disabled={draft.range === "All time"} title={draft.range === "All time" ? "All time has no preceding equivalent period" : "Compare the same length of time with the previous period"} onChange={e => setDraft({ ...draft, compare: e.target.value === "previous" })}><option value="previous">Compare: previous period</option><option value="off">No comparison</option></select></label>
    <div className={ui("filter-actions")}>{dirty && <span className={ui("unsaved-dot")} title="Unapplied changes" />}<button type="button" className={ui("text-button")} onClick={onReset} disabled={loading}><RotateCcw size={13} />Reset</button><button className={ui("button primary")} type="submit" disabled={loading}>Apply filters</button></div>
    {error && <p className={ui("filter-error")} role="alert">{error}</p>}
  </form>;
}

