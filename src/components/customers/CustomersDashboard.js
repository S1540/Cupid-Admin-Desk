"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  UsersRound,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/ChartCard";
import OrderDateFilter from "@/components/orders/OrderDateFilter";
import { useAdminStore } from "@/lib/admin-store";
import { refreshAdminData } from "@/lib/admin-sync";
import {
  CUSTOMER_FILTERS,
  CUSTOMER_SORTS,
  customersCsv,
  filterCustomers,
  normalizeCustomer,
  ownerCounts,
} from "@/lib/customer-records";
import { fetchCustomerPage, fetchCustomerTotal } from "@/lib/customers-data";
import { dateTime, number } from "@/lib/formatters";
import { ui } from "@/lib/ui";
import CustomerDetails from "./CustomerDetails";
const values = (rows, key) =>
  [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
export default function CustomersDashboard() {
  const sources = useAdminStore((state) => state.sources),
    refreshing = useAdminStore((state) => state.refreshing);
  const collapsed = useAdminStore((state) => state.collapsed),
    setCollapsed = useAdminStore((state) => state.setCollapsed);
  const filters = useAdminStore((state) => state.customerFilters),
    setFilters = useAdminStore((state) => state.setCustomerFilters);
  const source = sources.users;
  const [mobileOpen, setMobileOpen] = useState(false),
    [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0),
    [size, setSize] = useState(25),
    [pages, setPages] = useState([]),
    [total, setTotal] = useState(null),
    [pageLoading, setPageLoading] = useState(false),
    [pageError, setPageError] = useState("");
  const allRows = useMemo(
    () => source.rows.map(normalizeCustomer),
    [source.rows],
  );
  const orderCounts = useMemo(
    () =>
      sources.orders.complete && sources.orders.status === "ready"
        ? ownerCounts(sources.orders.rows)
        : null,
    [sources.orders],
  );
  const filtered = useMemo(
    () => filterCustomers(allRows, filters, orderCounts),
    [allRows, filters, orderCounts],
  );
  const cartCounts = useMemo(
    () => sources.cart.complete && sources.cart.status === "ready"
      ? ownerCounts(sources.cart.rows)
      : null,
    [sources.cart],
  );
  const complete = source.complete;
  const currentPage = complete
    ? Math.min(page, Math.max(0, Math.ceil(filtered.length / size) - 1))
    : page;
  const rows = complete
    ? filtered.slice(currentPage * size, (currentPage + 1) * size)
    : pages[currentPage]?.rows || [];
  const pending = ["idle", "loading"].includes(source.status);
  const loading =
    pending ||
    refreshing ||
    (!complete && source.status === "ready" && !pages.length && !pageError);
  const error = source.error || pageError;
  const count = complete ? filtered.length : total;
  const pageSize = complete ? size : 25;
  useEffect(() => {
    if (source.status !== "ready" || source.complete) return;
    let active = true;
    Promise.all([fetchCustomerPage(), fetchCustomerTotal()])
      .then(([first, total]) => {
        if (active) {
          setPages([first]);
          setTotal(total);
        }
      })
      .catch((error) => {
        if (active) setPageError(error.message);
      });
    return () => {
      active = false;
    };
  }, [source]);
  function change(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(0);
  }
  function reset() {
    setFilters(CUSTOMER_FILTERS);
    setPage(0);
  }
  async function next() {
    if (complete || pages[currentPage + 1]) {
      setPage(currentPage + 1);
      return;
    }
    if (pageLoading) return;
    setPageLoading(true);
    setPageError("");
    try {
      const result = await fetchCustomerPage(pages[currentPage].cursor);
      setPages((current) => [...current, result]);
      setPage(currentPage + 1);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setPageLoading(false);
    }
  }
  function exportRows() {
    const url = URL.createObjectURL(
      new Blob([customersCsv(filtered)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cupid-Customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const countries = values(allRows, "country"),
    cities = values(
      allRows.filter(
        (row) => !filters.country || row.country === filters.country,
      ),
      "city",
    ),
    onboarding = values(allRows, "onboarding");
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== "sort" && value !== CUSTOMER_FILTERS[key],
  );
  return (
    <div
      className={ui(`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`)}
    >
      <a href="#customers-main" className={ui("skip-link")}>
        Skip to customers
      </a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={ui("main-shell")}>
        <DashboardHeader
          title="Customers"
          eyebrow="YOUR CUSTOMER DIRECTORY"
          subtitle="Every customer. A clearer view of their activity."
          loading={loading}
          updated={source.updatedAt}
          hasErrors={Boolean(error)}
          connectionLabel={
            source.fromCache ? "CACHED" : complete ? "LIVE" : "INDEXED DATA"
          }
          onRefresh={() => {
            setPageError("");
            refreshAdminData();
          }}
          onMenu={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />
        <main id="customers-main" className={ui("dashboard-main pb-8")}>
          <section
            aria-label="Customer summary"
            className="mb-6 grid grid-cols-3 gap-3 max-[600px]:gap-2"
          >
            {[
              ["Total customers", complete ? allRows.length : total],
              [
                "Verified emails",
                complete
                  ? allRows.filter((row) => row.verified === true).length
                  : null,
              ],
              [
                "Customers with orders",
                complete && orderCounts
                  ? allRows.filter((row) => orderCounts[row.id] > 0).length
                  : null,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-border bg-surface px-4 py-3 max-[600px]:px-3"
              >
                <p className="text-[11px] text-muted">{label}</p>
                {loading ? (
                  <span className={ui("skeleton mt-2 block h-6 w-12")} />
                ) : (
                  <strong className="mt-1 block text-2xl font-medium tracking-tight tabular-nums">
                    {source.status === "error" && !source.rows.length
                      ? "—"
                      : number(value)}
                  </strong>
                )}
              </div>
            ))}
          </section>
          <section aria-label="Customer filters" className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className={ui("order-search")}>
                <Search size={17} />
                <input
                  aria-label="Search customers"
                  placeholder="Search name, email, phone or customer ID"
                  type="search"
                  value={filters.search}
                  disabled={!complete}
                  onChange={(event) => change("search", event.target.value)}
                />
              </label>
              <label className={ui("filter-field")}>
                <ArrowDownAZ size={15} />
                <select
                  aria-label="Sort customers"
                  value={filters.sort}
                  disabled={!complete}
                  onChange={(event) => change("sort", event.target.value)}
                >
                  {CUSTOMER_SORTS.filter(
                    ([key]) =>
                      !key.startsWith("coins") ||
                      allRows.some((row) => row.coins != null),
                  ).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={ui("button")}
                disabled={!complete || !filtered.length || loading}
                onClick={exportRows}
              >
                <Download size={14} />
                Export results
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <OrderDateFilter
                entity="customers"
                label="Joined date"
                start={filters.start}
                end={filters.end}
                disabled={!complete}
                onChange={(start, end) => {
                  setFilters((current) => ({ ...current, start, end }));
                  setPage(0);
                }}
              />
              <Select
                label="Email verification"
                value={filters.verification}
                disabled={!complete}
                onChange={(value) => change("verification", value)}
                options={[
                  ["all", "All email statuses"],
                  ["verified", "Verified email"],
                  ["unverified", "Unverified email"],
                  ["unknown", "Verification not recorded"],
                ]}
              />
              {countries.length > 0 && (
                <Select
                  label="Customer country"
                  value={filters.country}
                  disabled={!complete}
                  onChange={(value) => {
                    setFilters((current) => ({
                      ...current,
                      country: value,
                      city: "",
                    }));
                    setPage(0);
                  }}
                  options={[
                    ["", "All countries"],
                    ...countries.map((value) => [value, value]),
                  ]}
                />
              )}
              {cities.length > 0 && (
                <Select
                  label="Customer city"
                  value={filters.city}
                  disabled={!complete}
                  onChange={(value) => change("city", value)}
                  options={[
                    ["", "All cities"],
                    ...cities.map((value) => [value, value]),
                  ]}
                />
              )}
              {onboarding.length > 0 && (
                <Select
                  label="Onboarding status"
                  value={filters.onboarding}
                  disabled={!complete}
                  onChange={(value) => change("onboarding", value)}
                  options={[
                    ["", "All onboarding states"],
                    ...onboarding.map((value) => [value, value]),
                  ]}
                />
              )}
              {orderCounts && (
                <Select
                  label="Order activity"
                  value={filters.activity}
                  disabled={!complete}
                  onChange={(value) => change("activity", value)}
                  options={[
                    ["all", "Any order activity"],
                    ["ordered", "Has orders"],
                    ["none", "No orders"],
                  ]}
                />
              )}
              <button className={ui("text-button ml-auto")} onClick={reset}>
                Reset filters
              </button>
            </div>
          </section>
          {error && (
            <div className={ui("error-banner")} role="alert">
              <AlertCircle size={17} />
              <div>
                <strong>Customers need attention</strong>
                <p>{error}</p>
              </div>
              <button
                className={ui("text-button")}
                onClick={() => refreshAdminData()}
              >
                Retry
              </button>
            </div>
          )}
          {!complete && source.status === "ready" && (
            <p className="mb-4 text-xs leading-6 text-muted">
              All customers are accessible through record-ID pages.
              Full-directory search and sorting require a dedicated index beyond
              1,000 customers; filters are disabled to avoid partial results.
            </p>
          )}
          {source.fromCache && (
            <p role="status" className="mb-4 text-xs text-muted">
              Showing cached records while reconnecting to Firestore.
            </p>
          )}
          <section
            className={ui("panel")}
            aria-label="Customer directory"
            aria-busy={loading || pageLoading}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <UsersRound size={17} className="text-muted" />
                <h2>{hasFilters ? "Matching customers" : "All customers"}</h2>
                <span className="rounded bg-elevated px-2 py-1 text-[10px] text-muted">
                  {count == null ? "Loading" : number(count)}
                </span>
              </div>
              <span className="text-[11px] text-muted max-[600px]:hidden">
                {complete
                  ? "Changes sync automatically"
                  : "Ordered by record ID"}
              </span>
            </div>
            {loading ? (
              <div className={ui("table-loading")}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div className={ui("skeleton")} key={i} />
                ))}
              </div>
            ) : !rows.length ? (
              <EmptyState
                title={
                  error
                    ? "Customer data unavailable"
                    : hasFilters
                      ? "No matching customers"
                      : "No customers yet"
                }
                message={
                  error ||
                  (hasFilters
                    ? "Adjust your search or reset the filters."
                    : "Customer profiles will appear as they register.")
                }
              />
            ) : (
              <div className="relative overflow-x-auto">
                <table className="customers-table min-w-[890px] [&_th]:normal-case [&_th]:tracking-normal [&_th]:font-medium [&_td]:align-middle">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Joined</th>
                      <th>Email status</th>
                      <th title="Saved product entries in this customer's cart">Cart</th>
                      {orderCounts && <th>Orders</th>}
                      <th>
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <button
                            className="flex items-center gap-3 text-left"
                            onClick={() => setSelected(customer)}
                            aria-label={`View customer ${customer.name || customer.id}`}
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-elevated text-xs font-medium text-muted">
                              {(customer.name || customer.email || "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                            <span>
                              <strong className="block text-[13px] font-medium text-foreground hover:text-brand">
                                {customer.name || "Name not provided"}
                              </strong>
                              <small
                                className="mt-1 block max-w-60 truncate text-[11px] text-muted"
                                title={customer.email}
                              >
                                {customer.email || "Email not recorded"}
                              </small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span className="text-xs">
                            {customer.phone || "Phone not recorded"}
                          </span>
                          <small className="mt-1 block text-[11px] text-muted">
                            {[customer.city, customer.country]
                              .filter(Boolean)
                              .join(", ") || "Location not recorded"}
                          </small>
                        </td>
                        <td className="text-xs text-muted">
                          {dateTime(customer.createdAt)}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] ${customer.verified === true ? "text-success" : "text-muted"}`}
                          >
                            {customer.verified === true && (
                              <CheckCircle2 size={13} />
                            )}
                            {customer.verified == null
                              ? "Not recorded"
                              : customer.verified
                                ? "Verified"
                                : "Unverified"}
                          </span>
                        </td>
                        <td className="tabular-nums" title={cartCounts ? "Saved product entries" : sources.cart.error || "Cart data unavailable"}>
                          {number(cartCounts ? cartCounts[customer.id] || 0 : null)}
                        </td>
                        {orderCounts && (
                          <td className="tabular-nums">
                            {orderCounts[customer.id] || 0}
                          </td>
                        )}
                        <td>
                          <button
                            className={ui("icon-button")}
                            aria-label={`Open profile ${customer.id}`}
                            onClick={() => setSelected(customer)}
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-[11px] text-muted">
              <span>
                {count
                  ? `Showing ${currentPage * pageSize + 1}–${currentPage * pageSize + rows.length} of ${number(count)}`
                  : "No records"}
              </span>
              <div className="flex items-center gap-2">
                {complete && (
                  <label className="mr-2 flex items-center gap-2">
                    Rows
                    <select
                      className="rounded border border-border bg-elevated p-1.5 text-xs"
                      aria-label="Customers per page"
                      value={size}
                      onChange={(event) => {
                        setSize(Number(event.target.value));
                        setPage(0);
                      }}
                    >
                      {[10, 25, 50, 100].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  className={ui("icon-button")}
                  aria-label="Previous customers page"
                  disabled={currentPage === 0 || loading || pageLoading}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Page {currentPage + 1}</span>
                <button
                  className={ui("icon-button")}
                  aria-label="Next customers page"
                  disabled={
                    loading ||
                    pageLoading ||
                    !(complete
                      ? (currentPage + 1) * size < filtered.length
                      : pages[currentPage]?.hasMore)
                  }
                  onClick={next}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <p className="mt-4 text-[11px] leading-6 text-muted">
            {complete
              ? "Search and sorting use the shared live cache. No extra reads when you change filters."
              : "Cursor pages are cached for repeat visits."}{" "}
            Dates use your local time. Missing profile fields stay unconfirmed.
          </p>
        </main>
      </div>
      {selected && (
        <CustomerDetails
          customer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
function Select({ label, value, disabled, onChange, options }) {
  return (
    <label className={ui("filter-field")}>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
