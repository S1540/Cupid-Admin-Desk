"use client";
import { ui } from "@/lib/ui";

import { useState } from "react";
import {
  Heart,
  ShoppingBag,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  ShieldCheck,
  Database,
  Info,
} from "lucide-react";
import { DEFAULT_FILTERS, reportingPeriods } from "@/lib/analytics";
import { useAdminStore } from "@/lib/admin-store";
import { refreshAdminData } from "@/lib/admin-sync";
import { useDashboardData } from "@/lib/use-admin-data";
import { number, shortDate } from "@/lib/formatters";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import FilterBar from "./FilterBar";
import MetricCard from "./MetricCard";
import ChartCard from "./ChartCard";
import { StatusChart, TrendChart } from "./AnalyticsCharts";
import RecentActivity from "./RecentActivity";

export default function Dashboard() {
  const collapsed = useAdminStore(state => state.collapsed);
  const setCollapsed = useAdminStore(state => state.setCollapsed);
  const draft = useAdminStore(state => state.overviewDraft);
  const setDraft = useAdminStore(state => state.setOverviewDraft);
  const applied = useAdminStore(state => state.overviewFilters);
  const setApplied = useAdminStore(state => state.setOverviewFilters);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [validation, setValidation] = useState("");
  const { data, loading, error: fatal, cached, oversized } = useDashboardData(applied);
  const updated = data?.refreshedAt;
  const revision = updated || 0;
  function reload() { return refreshAdminData(); }
  function apply(event) {
    event.preventDefault();
    try { reportingPeriods(draft); setValidation(""); setApplied({ ...draft }); }
    catch (error) { setValidation(error.message); }
  }
  function reset() { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); setValidation(""); }
  const errors = [
    ...new Set(
      [fatal, ...Object.values(data || {}).map((value) => value?.error)].filter(
        Boolean,
      ),
    ),
  ];
  const metrics = [
    { key: "newUsers", title: "Registered customers", icon: Users, note: applied.range, description: "Customers registered within the selected dates. Email-verification filter applies. All time includes every customer document.", accent: true },
    { key: "periodOrders", title: "Total orders", icon: ShoppingBag, note: applied.range, description: "Total orders created within the selected dates, matching the selected order status." },
    { key: "pendingOrders", title: "Pending orders", icon: Package, note: applied.range, description: "Orders created in this period whose recorded status is pending. This is the current status, not historical backlog.", inverse: true },
    { key: "paidOrders", title: "Orders marked paid", icon: ShieldCheck, note: applied.range, description: "Orders created in this period with the stored status paid. This is an order-status count, not audited payment revenue." },
    { key: "cart", title: "Cart products", icon: ShoppingCart, note: "Current snapshot", description: "Product entries currently saved in carts, not summed quantities or distinct products. Historical snapshots are not stored, so date filters and comparisons do not apply.", snapshot: true },
  ];
  const comparison = data?.comparison?.value;
  const comparisonPeriod = data?.previous ? `${shortDate(data.previous.start)} - ${shortDate(new Date(+data.previous.end - 1))}` : null;
  const orderInfo = data?.orders?.value;
  const period = data?.range
    ? `${data.range.start ? shortDate(data.range.start) : "Beginning"} - ${shortDate(new Date(+data.range.end - 1))}`
    : applied.range;
  return (
    <div className={ui(`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`)}>
      <a href="#main" className={ui("skip-link")}>
        Skip to analytics
      </a>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={ui("main-shell")}>
        <DashboardHeader
          loading={loading}
          updated={updated}
          hasErrors={errors.length > 0} connectionLabel={cached ? "CACHED" : oversized ? "INDEXED DATA" : "LIVE"}
          onRefresh={() => reload()}
          onMenu={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(value => !value)}
        />
        <main id="main" className={ui("dashboard-main")}>
          <FilterBar
            draft={draft}
            setDraft={setDraft}
            onApply={apply}
            onReset={reset}
            loading={loading}
            error={validation}
            dirty={JSON.stringify(draft) !== JSON.stringify(applied)}
            statuses={orderInfo?.availableStatuses || []}
          />
          <div className={ui("scope-note")}>
            <Info size={12} />
            <span>
              Customer and order cards follow your dates. Cart shows current saved product entries. Dates use your local time.
            </span>
          </div>
          {errors.length > 0 && (
            <div className={ui("error-banner")} role="alert">
              <AlertCircle size={17} />
              <div>
                <strong>Some analytics could not be loaded</strong>
                <p>{errors[0]}</p>
                {errors.length > 1 && (
                  <details>
                    <summary>
                      {errors.length - 1} more data issue
                      {errors.length > 2 ? "s" : ""}
                    </summary>
                    {errors.slice(1).map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </details>
                )}
              </div>
              <button
                className={ui("text-button")}
                onClick={() => reload()}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          )}
          <div className={ui("section-label")}>
            <h2>{applied.range === "Today" ? "Today's performance" : "Performance for your selected period"}</h2>
            <span>
              <span className={ui("legend-dot")} />
              {period}
            </span>
          </div>
          {comparisonPeriod && <div className={ui("comparison-context")}><span className={ui("comparison-marker")} />Compared with {comparisonPeriod}<span>Same-length period{data.range.end.getHours() || data.range.end.getMinutes() ? " · through the same time of day" : ""}</span></div>}
          <section
            className={ui("metric-grid")}
            aria-label="Key metrics"
            aria-busy={loading}
          >
            {metrics.map(({ key, ...metric }) => (
              <MetricCard
                key={key}
                {...metric}
                loading={loading}
                value={data?.[key]?.value}
                error={data?.[key]?.error || fatal}
                compare={Boolean(data?.previous) && !metric.snapshot}
                previous={comparison?.[key]?.value}
                comparisonError={comparison?.[key]?.error}
              />
            ))}
          </section>
          <div className={ui("analytics-grid")}>
            <ChartCard
              title="Customer registrations"
              subtitle={`New registrations by ${data?.registrations?.value?.grouping || "day"}`}
              aside={
                <span className={ui("chart-legend")}>
                  <i />
                  New Login
                </span>
              }
              className={ui("acquisition-panel")}
            >
              <div className={ui("chart-summary")}>
                <strong>{loading ? "-" : number(data?.newUsers?.value)}</strong>
                <span>customers in this period</span>
                <span className={ui("tag ml-auto")}>{period}</span>
              </div>
              <TrendChart
                data={data?.registrations?.value?.points}
                previousData={comparison?.registrations?.value?.points}
                grouping={data?.registrations?.value?.grouping}
                animationKey={data?.refreshedAt}
                loading={loading}
                error={data?.registrations?.error || fatal}
              />
              <div className={ui("panel-footnote")}>
                {comparison?.registrations?.value && <span className={ui("previous-legend")}><i />Dashed line: previous period</span>}
                {data?.registrations?.value?.grouping === "hour" ? "Hourly registrations, through the latest refresh." : "Each dot shows the exact registration count for that date."}
                <span>New Login shows account registrations; sign-in events are not tracked.</span>
              </div>
            </ChartCard>
            <ChartCard
              title="Order status"
              subtitle="Where your orders stand"
              aside={
                <span className={ui("tag")}>
                  {applied.status === "all" ? "By status" : applied.status}
                </span>
              }
            >
              <StatusChart
                data={orderInfo?.statuses}
                loading={loading}
                error={data?.orders?.error || fatal}
              />
              <div className={ui("panel-footnote")}>
                Statuses reflect the values recorded in Firestore.
              </div>
            </ChartCard>
            <ChartCard
              className={ui("orders-panel")} title="Orders over time"
              subtitle={`Orders placed by ${orderInfo?.grouping || "day"}`}
              aside={
                <span className={ui("chart-legend secondary")}>
                  <i />
                  Total orders
                </span>
              }
            >
              <div className={ui("chart-summary")}>
                <strong>
                  {loading ? "-" : number(data?.periodOrders?.value)}
                </strong>
                <span>orders in this period</span>
              </div>
              <TrendChart
                data={orderInfo?.points}
                previousData={comparison?.orders?.value?.points}
                grouping={orderInfo?.grouping}
                animationKey={data?.refreshedAt}
                type="orders"
                loading={loading}
                error={data?.orders?.error || fatal}
              />
            </ChartCard>

          </div>
<section className={ui("snapshot-section")} aria-label="Current saved items">            <ChartCard
              title="Saved items right now"
              subtitle="Current snapshot - independent of the date filter"
              aside={<span className={ui("tag snapshot-tag")}>Current snapshot</span>}
            >
              <div className={ui("activity-list")}>
                {[
                  {
                    key: "cart",
                    label: "Items in carts",
                    icon: ShoppingCart,
                    note: "Saved cart documents",
                  },
                  {
                    key: "wishlist",
                    label: "Wishlist saves",
                    icon: Heart,
                    note: "Saved wishlist documents",
                  },
                ].map(({ key, label, icon: Icon, note }) => (
                  <div className={ui("activity-row")} key={key}>
                    <span className={ui(`activity-icon ${key}`)}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <small>{note}</small>
                    </div>
                    <b title={data?.[key]?.error}>
                      {loading ? "-" : number(data?.[key]?.value)}
                    </b>
                  </div>
                ))}
              </div>
              <div className={ui("data-note")}>
                <ShieldCheck size={17} />
                <div>
                  <strong>Measured with care</strong>
                  <p>
                    Item counts are not unique customers or purchased units.
                    Revenue is omitted until paid status and currency are
                    verified.
                  </p>
                </div>
              </div>
            </ChartCard></section>
          <RecentActivity
            key={`${JSON.stringify(applied)}-${revision}-${data?.refreshedAt || "loading"}`}
            initial={data?.recent}
            filters={{ ...applied, anchor: data?.range }}
            loading={loading}
          />
          <footer className={ui("dashboard-footer")}>
            <span>
              <Heart size={12} />
              Cupid Clothings <span className={ui("footer-divider")}>/</span> Made for
              the details.
            </span>
            <span>
              <Database size={12} />
              Firestore data<span className={ui("footer-divider")}>-</span>
              {loading
                ? "Syncing"
                : errors.length
                  ? "Partial availability"
                  : "Read-only analytics"}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}



