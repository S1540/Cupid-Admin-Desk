
import { ui } from "@/lib/ui";
import { ChartNoAxesCombined } from "lucide-react";
export function EmptyState({ title = "No records in this period", message = "Try a wider date range to see your activity.", error }) {
  return <div className={ui("empty-state")}><span className={ui("empty-icon")}><ChartNoAxesCombined size={24} strokeWidth={1.3} /></span><strong>{error ? "Data unavailable" : title}</strong><p>{error || message}</p></div>;
}
export default function ChartCard({ title, subtitle, aside, children, className = "" }) {
  return <section className={ui(`panel ${className}`)}><div className={ui("panel-heading")}><div><h2>{title}</h2><p>{subtitle}</p></div>{aside}</div>{children}</section>;
}
