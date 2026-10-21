"use client";
import { ui } from "@/lib/ui";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Download, X, CheckCircle2 } from "lucide-react";
import { updateOrderStatuses } from "@/lib/orders-data";
import { orderChanges } from "@/lib/order-updates";

export default function OrderActions({ order, options, onSaved }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(order.editValues);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [committed, setCommitted] = useState(null);
  const [menuPosition, setMenuPosition] = useState({});
  const dialog = useRef(null);
  const menu = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    const key = event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  useEffect(() => {
    if (!editing) return;
    dialog.current.showModal();
    const original = document.body.style.overflow;
    const returnFocus = trigger.current;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; returnFocus?.focus(); };
  }, [editing]);
  function closeEditor() { setEditing(false); if (committed) onSaved(committed); }
  function edit() { setDraft(order.editValues); setCommitted(null); setError(""); setSaved(false); setOpen(false); setEditing(true); }
  async function download() {
    setDownloading(true); setError("");
    try { const { downloadOrderPdf } = await import("@/lib/order-pdf"); await downloadOrderPdf(committed || order); setOpen(false); }
    catch { setError("PDF download failed. Please try again."); }
    finally { setDownloading(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try { const updated = await updateOrderStatuses(order, draft); setCommitted(updated); setSaved(true); }
    catch (error) { setError(error.message || "Could not save. Check your connection and retry."); }
    finally { setSaving(false); }
  }
  let changed = false;
  try { changed = Object.keys(orderChanges(order.editValues, draft)).length > 0; } catch { changed = true; }
  return <>
    <button ref={trigger} className={ui("icon-button")} aria-label={`Actions for ${order.reference}`} aria-expanded={open} onClick={() => { const box = trigger.current.getBoundingClientRect(); setMenuPosition({ right: Math.max(12, innerWidth - box.right), top: Math.max(12, Math.min(box.bottom + 6, innerHeight - 140)) }); setOpen(value => !value); }}><MoreHorizontal size={19} /></button>
    {open && <div ref={menu} className={ui("order-action-menu")} style={menuPosition} aria-label="Order actions"><button onClick={edit}><Pencil size={15} />Update statuses</button><button disabled={downloading} onClick={download}><Download size={15} />{downloading ? "Preparing PDF…" : "Download PDF"}</button>{error && <p role="alert">{error}</p>}</div>}
    {editing && <dialog ref={dialog} className={ui("status-editor")} aria-label={`Update order ${order.reference}`} onCancel={event => { event.preventDefault(); if (!saving) closeEditor(); }}>
      <form onSubmit={save}>
        <header><div><span className={ui("eyebrow")}>UPDATE RECORD</span><h2>{order.reference}</h2></div><button type="button" className={ui("icon-button")} aria-label="Close status editor" disabled={saving} onClick={closeEditor}><X size={19} /></button></header>
        <p className={ui("editor-intro")}>Set the recorded order, payment and delivery status.</p>
        {saved ? <div className={ui("order-save-success")} role="status"><CheckCircle2 size={21} /><div><strong>Changes saved</strong><p>Your order record is up to date.</p></div></div> : <div className={ui("editor-fields")}>{[["status", "Order status"], ["payment", "Payment status"], ["delivery", "Delivery status"]].map(([field, label]) => <label key={field}>{label}<input list={`status-options-${field}-${order.id}`} aria-label={`Update ${label.toLowerCase()}`} value={draft[field]} placeholder="Choose or enter a status" maxLength={80} disabled={saving} onChange={event => setDraft(value => ({ ...value, [field]: event.target.value }))} /><datalist id={`status-options-${field}-${order.id}`}>{[...new Set([order.editValues[field], ...options[field]])].filter(Boolean).map(value => <option key={value} value={value} />)}</datalist></label>)}</div>}
        {!saved && <p className={ui("editor-help")}>Status updates change this record only. They do not charge, refund or dispatch an order.</p>}
        {error && <p className={ui("editor-error")} role="alert">{error}</p>}
        <footer>{saved ? <><button type="button" className={ui("button")} disabled={downloading} onClick={download}><Download size={15} />{downloading ? "Preparing…" : "Download updated PDF"}</button><button type="button" className={ui("button primary")} onClick={closeEditor}>Done</button></> : <><button type="button" className={ui("button")} disabled={saving} onClick={() => setEditing(false)}>Cancel</button><button className={ui("button primary")} disabled={saving || !changed}>{saving ? "Saving…" : "Save changes"}</button></>}</footer>
      </form>
    </dialog>}
  </>;
}

