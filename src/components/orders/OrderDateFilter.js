"use client";
import { ui } from "@/lib/ui";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
const keyFor = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromKey = value => { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d); };
export default function OrderDateFilter({ start, end, onChange, disabled, entity = "orders", label = "Order date" }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(null);
  const [draft, setDraft] = useState({ start: "", end: "" });
  const [choosingEnd, setChoosingEnd] = useState(false);
  const dialog = useRef(null);
  useEffect(() => { if (open) dialog.current.showModal(); }, [open]);
  function show() { setDraft({ start, end }); setMonth(start ? fromKey(start) : new Date()); setChoosingEnd(false); setOpen(true); }
  function pick(value) {
    if (!choosingEnd) { setDraft({ start: value, end: value }); setChoosingEnd(true); }
    else { setDraft({ start: value < draft.start ? value : draft.start, end: value < draft.start ? draft.start : value }); setChoosingEnd(false); }
  }
  const count = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() : 0;
  const offset = month ? (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 : 0;
  function move(amount) { setMonth(value => new Date(value.getFullYear(), value.getMonth() + amount, 1)); }
  return <>
    <button className={ui(`button order-date-trigger ${start ? "has-date" : ""}`)} onClick={show} disabled={disabled}><CalendarDays size={16} />{start ? `${fromKey(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}${end && end !== start ? ` – ${fromKey(end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}` : label}</button>
    {open && <dialog ref={dialog} className={ui("order-calendar")} aria-label={`Filter ${entity} by date`} onCancel={() => setOpen(false)}>
      <header><div><span className={ui("eyebrow")}>{label.toUpperCase()}</span><h2>Find your {entity}</h2></div><button className={ui("icon-button")} aria-label="Close date filter" onClick={() => setOpen(false)}><X size={18} /></button></header>
      <div className={ui("calendar-inputs")}><label>From<input type="date" value={draft.start} onChange={event => { setDraft(value => ({ ...value, start: event.target.value })); if (event.target.value) setMonth(fromKey(event.target.value)); }} /></label><label>To<input type="date" value={draft.end} min={draft.start} onChange={event => setDraft(value => ({ ...value, end: event.target.value }))} /></label></div>
      <div className={ui("calendar-month")}><button className={ui("icon-button")} aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft size={17} /></button><strong aria-live="polite">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</strong><button className={ui("icon-button")} aria-label="Next month" onClick={() => move(1)}><ChevronRight size={17} /></button></div>
      <div className={ui("calendar-grid")}>{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => <span className={ui("calendar-weekday")} key={day}>{day}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: count }, (_, index) => {
        const date = new Date(month.getFullYear(), month.getMonth(), index + 1), value = keyFor(date);
        const selected = value === draft.start || value === draft.end;
        return <button key={value} aria-label={date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} aria-pressed={selected} className={ui(`${selected ? "selected" : ""} ${draft.start && value > draft.start && value < draft.end ? "in-range" : ""} ${value === keyFor(new Date()) ? "is-today" : ""}`)} onClick={() => pick(value)}>{index + 1}</button>;
      })}</div>
      <p className={ui("calendar-hint")} aria-live="polite">{choosingEnd ? "Select an end date, or apply for this day only." : "Select one day or a start and end date."}</p>
      <footer><button className={ui("text-button")} onClick={() => { onChange("", ""); setOpen(false); }}>Clear dates</button><button className={ui("button primary")} disabled={!draft.start || (draft.end && draft.end < draft.start)} onClick={() => { onChange(draft.start, draft.end || draft.start); setOpen(false); }}>Apply dates</button></footer>
    </dialog>}
  </>;
}
