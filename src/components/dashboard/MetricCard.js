
import { ui } from "@/lib/ui";
import { ArrowDownRight, ArrowUpRight, Minus, Info } from "lucide-react";
import { number } from "@/lib/formatters";
import { compareValues } from "@/lib/analytics";

export default function MetricCard({ title, value, icon: Icon, note, description, loading, error, accent, previous, compare, comparisonError, inverse, snapshot }) {
  const change = compareValues(value, previous);
  const ChangeIcon = !change?.difference ? Minus : change.difference > 0 ? ArrowUpRight : ArrowDownRight;
  const positive = change && (inverse ? change.difference < 0 : change.difference > 0);
  return <article className={ui(`metric-card ${accent ? "metric-accent" : ""}`)}>
    <div className={ui("metric-heading")}><span>{title}</span><Icon size={19} /></div>
    {loading ? <div className={ui("skeleton metric-skeleton")} /> : <strong className={ui("metric-value")} title={error || description}>{number(value)}</strong>}
    <div className={ui("metric-note")}><span>{error ? "Unavailable" : note}</span><span tabIndex={0} className={ui("info-tip")} aria-label={error || description}><Info size={14} /><span role="tooltip">{error || description}</span></span></div>
    {compare && !loading && <div className={ui("metric-comparison")} title={comparisonError || "Compared with the preceding equivalent period, using the same filters"}>
      {change ? <><span className={ui(`change-badge ${!change.difference ? "neutral" : positive ? "positive" : "negative"}`)}><ChangeIcon size={12} />{change.label}</span><span>vs {number(previous)}</span></> : <span>Comparison unavailable</span>}
    </div>}
    {snapshot && !loading && <div className={ui("snapshot-card-note")}><span className={ui("snapshot-dot")} />Saved entries now</div>}
  </article>;
}
