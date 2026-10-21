"use client";
import { ui } from "@/lib/ui";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore, cachedRequest } from "@/lib/admin-store";
import { refreshAdminData } from "@/lib/admin-sync";
import { normalizeOrder } from "@/lib/order-records";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, Truck, Circle, ChevronLeft, ChevronRight, Info, Package, Search, ShoppingBag } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/ChartCard";
import { fetchOrderLedger, fetchOrderPage } from "@/lib/orders-data";
import { filterOrders, orderAmount } from "@/lib/order-records";
import { explainError } from "@/lib/dashboard-data";
import { dateTime, number } from "@/lib/formatters";
import OrderDetails from "./OrderDetails";
import OrderActions from "./OrderActions";
import OrderDateFilter from "./OrderDateFilter";

const EMPTY_FILTERS = { search: "", status: "", delivery: "", payment: "", method: "", start: "", end: "" };
const options = (rows, key) => [...new Set(rows.map(row => row[key]).filter(Boolean))].sort();
function Status({ value }) {
  if (!value) return <span className={ui("not-recorded")}>Not recorded</span>;
  const lower = value.trim().toLowerCase();
  const tone = /cancel|failed|rto|returned|undelivered|exception/.test(lower) ? "attention"
    : ["paid", "marked paid", "delivered", "completed", "complete", "success", "successful"].includes(lower) ? "success"
    : /pending|awaiting|unpaid|processing|^new$/.test(lower) ? "pending"
    : /shipped|transit|out for delivery|dispatched/.test(lower) ? "transit" : "neutral";
  const Icon = { success: CheckCircle2, pending: Clock3, attention: AlertCircle, transit: Truck, neutral: Circle }[tone];
  return <span className={ui(`order-status ${tone}`)}><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{value.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bRto\b/g, "RTO")}</span>;
}
export default function OrdersDashboard() {
  const collapsed = useAdminStore(state => state.collapsed);
  const setCollapsed = useAdminStore(state => state.setCollapsed);
  const source = useAdminStore(state => state.sources.orders);
  const refreshing = useAdminStore(state => state.refreshing);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [remoteLedger, setRemoteLedger] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [serverPages, setServerPages] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const closeDetails = useCallback(() => setSelected(null), []);
  const liveLedger = useMemo(() => source.complete ? {
    mode: "snapshot", total: source.rows.length, refreshedAt: source.updatedAt,
    rows: source.rows.map(row => normalizeOrder(row.id, row.data, row.path)).sort((a,b) => (b.createdAt ?? -Infinity) - (a.createdAt ?? -Infinity) || a.key.localeCompare(b.key))
  } : null, [source]);
  const ledger = liveLedger || remoteLedger;
  const loading = refreshing || ["idle", "loading"].includes(source.status) || (source.status === "ready" && !source.complete && !remoteLedger && !error);
  const displayError = source.error || error;
  useEffect(() => {
    mounted.current = true; let active = true;
    if (source.status === "ready" && !source.complete) cachedRequest("orders:ledger", fetchOrderLedger).then(result => {
      if (active) { setRemoteLedger(result); setServerPages([result]); }
    }).catch(err => { if (active) setError(explainError(err)); });
    return () => { active = false; mounted.current = false; };
  }, [source]);
  function refresh() { if (!loading && !pageLoading) { setError(""); setPage(0); setSelected(null); refreshAdminData(); } }
  function savedOrder() { setPage(0); /* The shared listener receives the confirmed transaction. */ }
  function changeFilter(field, value) { setFilters(current => ({ ...current, [field]: value })); setPage(0); }
  const complete = ledger?.mode === "snapshot";
  const allRows = complete ? ledger.rows : serverPages.flatMap(result => result.rows);
  const filtered = complete ? filterOrders(allRows, filters) : serverPages[page]?.rows || [];
  const safePage = complete ? Math.min(page, Math.max(0, Math.ceil(filtered.length / size) - 1)) : page;
  const rows = complete ? filtered.slice(safePage * size, (safePage + 1) * size) : filtered;
  const paymentMethods = options(allRows, "paymentMethod");
  const statuses = options(allRows, "status");
  const deliveries = options(allRows, "delivery");
  const payments = options(allRows, "paymentStatus");
  const hasMethod = paymentMethods.length > 0;
  const hasDelivery = allRows.some(row => row.delivery || row.courier || row.awb);
  const count = complete ? filtered.length : ledger?.total;
  const pageSize = complete ? size : 25;
  const canNext = complete ? (safePage + 1) * size < filtered.length : serverPages[page]?.hasMore;
  async function nextPage() {
    if (complete || serverPages[page + 1]) { setPage(safePage + 1); return; }
    if (busy.current) return;
    busy.current = true; setPageLoading(true); setError("");
    try {
      const cursor = serverPages[page].cursor;
      const next = await cachedRequest(`orders:page:${cursor?.ref?.path || "start"}`, () => fetchOrderPage(cursor));
      if (mounted.current) { setServerPages(current => [...current, next]); setPage(value => value + 1); }
    } catch (err) { if (mounted.current) setError(explainError(err)); }
    finally { busy.current = false; if (mounted.current) setPageLoading(false); }
  }
  return <div className={ui(`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`)}>
    <a href="#orders-main" className={ui("skip-link")}>Skip to orders</a>
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    <div className={ui("main-shell")}>
      <DashboardHeader title="Orders" subtitle="Every order, its recorded payment state and delivery progress." eyebrow="COMMERCE WORKSPACE" loading={loading} updated={ledger?.refreshedAt} hasErrors={Boolean(displayError)} connectionLabel={source.fromCache ? "CACHED" : source.complete ? "LIVE" : "INDEXED DATA"} onRefresh={refresh} onMenu={() => setMobileOpen(true)} collapsed={collapsed} onToggleSidebar={() => setCollapsed(value => !value)} />
      <main id="orders-main" className={ui("dashboard-main orders-main")}>
        <div className={ui("orders-toolbar")}>
          <OrderDateFilter start={filters.start} end={filters.end} disabled={!complete || loading} onChange={(start, end) => { setFilters(current => ({ ...current, start, end })); setPage(0); }} />
          <label className={ui("order-search")}><Search size={17} /><input type="search" aria-label="Search orders" placeholder="Search order, customer or product" value={filters.search} disabled={!complete || loading} onChange={event => changeFilter("search", event.target.value)} /></label>
          {statuses.length > 0 && <label className={ui("filter-field")}><select aria-label="Filter order status" disabled={!complete || loading} value={filters.status} onChange={event => changeFilter("status", event.target.value)}><option value="">All order statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>}
          {deliveries.length > 0 && <label className={ui("filter-field")}><select aria-label="Filter delivery status" disabled={!complete || loading} value={filters.delivery} onChange={event => changeFilter("delivery", event.target.value)}><option value="">All delivery statuses</option>{deliveries.map(value => <option key={value}>{value}</option>)}</select></label>}
          {payments.length > 0 && <label className={ui("filter-field")}><select aria-label="Filter payment status" disabled={!complete || loading} value={filters.payment} onChange={event => changeFilter("payment", event.target.value)}><option value="">All payment records</option>{payments.map(value => <option key={value}>{value}</option>)}</select></label>}
          {hasMethod && <label className={ui("filter-field")}><select aria-label="Filter payment method" disabled={!complete || loading} value={filters.method} onChange={event => changeFilter("method", event.target.value)}><option value="">All payment methods</option>{paymentMethods.map(value => <option key={value}>{value}</option>)}</select></label>}
          <button className={ui("text-button")} disabled={loading} onClick={() => { setFilters(EMPTY_FILTERS); setPage(0); }}>Reset</button>
        </div>
        {displayError && <div className={ui("error-banner")} role="alert"><AlertCircle size={17} /><div><strong>Orders could not be updated</strong><p>{displayError}{ledger ? " Previously loaded records remain visible." : ""}</p></div><button className={ui("text-button")} onClick={refresh} disabled={loading}>Retry</button></div>}
        {!loading && !displayError && !hasMethod && <div className={ui("order-data-note")}><Info size={15} /><span>Payment methods are not recorded yet. Paid labels reflect order status, not verified payment transactions.</span></div>}
        {ledger?.mode === "paged" && <div className={ui("order-data-note")}><Info size={15} /><span>All orders are available through record-ID pagination. Full-store search and filters need a dedicated search index at this size.</span></div>}
        <section className={ui("panel orders-panel-table")} aria-label="Orders list" aria-busy={loading || pageLoading}>
          <div className={ui("panel-heading")}><div className={ui("orders-list-title")}><ShoppingBag size={18} /><h2>All orders</h2><span className={ui("tag")}>{loading ? "Loading" : `${number(count)} ${count === 1 ? "order" : "orders"}`}</span></div><span className={ui("orders-sort")}>{filters.start ? "Filtered dates" : "All time"} {complete ? "· Newest first" : "· By record ID"}</span></div>
          {loading ? <div className={ui("table-loading")}>{[0, 1, 2, 3, 4].map(index => <div key={index} className={ui("skeleton")} />)}</div> : !ledger ? <EmptyState error={displayError || "No order data is available."} /> : !rows.length ? <EmptyState title={allRows.length ? "No matching orders" : "No orders yet"} message={allRows.length ? "Try another search or reset the filters." : "Orders will appear here when they are saved to Firestore."} /> : <div className={ui("table-scroll")}><table className={ui("orders-table")}><thead><tr><th>Order</th><th>Customer</th><th>Order status</th><th>Payment</th>{hasMethod && <th>Method</th>}{hasDelivery && <th>Delivery</th>}<th className={ui("price-heading")}>Price</th><th><span className={ui("sr-only")}>Details</span></th></tr></thead><tbody>{rows.map(order => <tr key={order.key}><td><button className={ui("order-reference")} onClick={() => setSelected(order)} aria-label={`Open order ${order.reference}`}>{order.reference}</button><small>{dateTime(order.createdAt)}</small></td><td><strong className={ui("order-customer")}>{order.customer || "Not recorded"}</strong>{order.location && <small className={ui("order-location")} title={order.location}>{order.location}</small>}</td><td><Status value={order.status} /></td><td><Status value={order.paymentStatus} />{order.paymentSource && <small>{order.paymentSource}</small>}</td>{hasMethod && <td>{order.paymentMethod || <span className={ui("not-recorded")}>Not recorded</span>}</td>}{hasDelivery && <td><Status value={order.delivery} />{order.courier && <small>{order.courier}</small>}</td>}<td className={ui("order-amount")}>{orderAmount(order.amount, order.currency)}</td><td><div className={ui("order-row-actions")}><button className={ui("icon-button")} onClick={() => setSelected(order)} aria-label={`View details for ${order.reference}`}><ArrowUpRight size={17} /></button><OrderActions order={order} options={{ status: statuses, payment: allRows.map(row => row.editValues.payment).filter(Boolean), delivery: deliveries }} onSaved={savedOrder} /></div></td></tr>)}</tbody></table></div>}
          {ledger && !loading && <div className={ui("table-footer")}><span>{count ? `Showing ${safePage * pageSize + 1}-${safePage * pageSize + rows.length} of ${number(count)}` : "0 orders"}</span><div>{complete && <label className={ui("page-size-label")}>Rows<select aria-label="Orders per page" value={size} onChange={event => { setSize(Number(event.target.value)); setPage(0); }}>{[5, 10, 25, 50].map(value => <option key={value}>{value}</option>)}</select></label>}<button className={ui("icon-button")} aria-label="Previous orders page" disabled={safePage === 0 || pageLoading} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button><span>Page {safePage + 1}</span><button className={ui("icon-button")} aria-label="Next orders page" disabled={!canNext || pageLoading} onClick={nextPage}>{pageLoading ? <span className={ui("small-spinner")} /> : <ChevronRight size={16} />}</button></div></div>}
        </section>
        <div className={ui("orders-bottom-note")}><Package size={14} /><span>Showing recorded order and tracking details. Missing fields remain unconfirmed.</span></div>
      </main>
    </div>
    <OrderDetails order={selected} onClose={closeDetails} />
  </div>;
}



