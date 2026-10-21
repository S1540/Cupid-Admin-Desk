
import { ui } from "@/lib/ui";
import { Menu, RefreshCw, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { time } from "@/lib/formatters";
export default function DashboardHeader({
  loading,
  updated,
  hasErrors,
  onRefresh,
  onMenu,
  collapsed,
  onToggleSidebar,
  title = "Overview",
  subtitle = "A closer look at your customers and commerce.",
  eyebrow = "YOUR STORE, AT A GLANCE",
  connectionLabel = "LIVE",
}) {
  return (
    <>
      {loading && (
        <div
          className={ui("refresh-progress")}
          role="progressbar"
          aria-label="Refreshing analytics"
        >
          <span />
        </div>
      )}
      <div className={ui("topbar")}>
        <div className={ui("flex items-center gap-3")}>
          <button
            className={ui("icon-button desktop-sidebar-toggle")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={onToggleSidebar}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <button
            className={ui("icon-button mobile-menu")}
            aria-label="Open navigation"
            onClick={onMenu}
          >
            <Menu size={20} />
          </button>
          <span className={ui("breadcrumb")}>
            Workspace <span>/</span> <b>{title}</b>
          </span>
        </div>
        <span className={ui(`connection ${hasErrors ? "warning" : ""}`)}>
          <i />
          {loading
            ? "Connecting to Firestore"
            : hasErrors
              ? "Data needs attention"
              : connectionLabel}
        </span>
        <ThemeToggle />
        <span className={ui("top-avatar")}>CC</span>
      </div>
      <header className={ui("page-header")}>
        <div>
          <div className={ui("eyebrow")}>{eyebrow}</div>
          <h1>
            {title}
            {title === "Overview" && <span>.</span>}
          </h1>
          <p>{subtitle}</p>
        </div>
        <div className={ui("refresh-group")}>
          <span aria-live="polite">
            {updated
              ? `Last successful sync ${time(updated)}`
              : "Awaiting first successful sync"}
          </span>
          <button className={ui("button")} onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} className={ui(loading ? "animate-spin" : "")} />
            {loading ? "Refreshing" : "Refresh data"}
          </button>
        </div>
      </header>
    </>
  );
}
