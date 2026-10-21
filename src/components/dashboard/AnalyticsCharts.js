"use client";
import { ui } from "@/lib/ui";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { shortDate, compact, number } from "@/lib/formatters";
import { EmptyState } from "./ChartCard";

function subscribeMotion(callback) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function motionSnapshot() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function useReducedMotion() { return useSyncExternalStore(subscribeMotion, motionSnapshot, () => true); }
function statusColor(name) {
  const status = name.toLowerCase();
  if (["paid", "delivered", "completed"].includes(status)) return "var(--success)";
  if (["pending", "processing"].includes(status)) return "var(--chart-pending)";
  if (["cancelled", "canceled", "failed"].includes(status)) return "var(--accent)";
  return "var(--chart-other)";
}
const tooltip = { background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 13, lineHeight: 1.6 };
const hour = value => new Intl.DateTimeFormat("en", { hour: "numeric", hour12: true }).format(new Date(value));
function RegistrationDot({ cx, cy, index, latest, reduced }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return <g className={ui(`registration-dot ${reduced ? "reduced" : ""}`)} style={{ "--dot-delay": `${Math.min(index * 20, 220)}ms` }}>
    {latest && <circle className={ui("latest-dot-halo")} cx={cx} cy={cy} r={8} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1.4} />}
    <circle className={ui("registration-dot-core")} cx={cx} cy={cy} r={latest ? 5.5 : 3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
  </g>;
}
export function TrendChart({ data, previousData, grouping = "day", type = "users", loading, error, animationKey }) {
  const reduced = useReducedMotion();
  if (loading) return <div className={ui("chart-skeleton skeleton")} />;
  if (error || !data?.length || (data.every(p => !p[type]) && !previousData?.some(p => p[type]))) return <EmptyState error={error} />;
  const points = data.map((row, index) => ({ ...row, previous: previousData?.[index]?.[type] ?? null, previousDate: previousData?.[index]?.date }));
  const Chart = type === "users" ? AreaChart : BarChart;
  const dateLabel = grouping === "hour" ? hour : shortDate;
  const everyDay = grouping === "day" && points.length <= 14;
  const axisLabel = everyDay ? value => new Date(value).getDate() : dateLabel;
  const latest = points.at(-1);
  const isCurrentDay = new Date(latest.date).toDateString() === new Date().toDateString();
  return <div className={ui("chart-container")} aria-label={`${type === "users" ? "Customer registrations" : "Orders"} over time; ${number(data.reduce((sum, row) => sum + row[type], 0))} total. Hover or use arrow keys to explore exact counts.`}>
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={points} margin={{ top: 22, right: 22, bottom: 4, left: -9 }} accessibilityLayer>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="date" tickFormatter={axisLabel} interval={everyDay ? 0 : "preserveStartEnd"} stroke="var(--muted)" axisLine={false} tickLine={false} minTickGap={everyDay ? 0 : 35} tick={{ fontSize: 12 }} dy={10} />
        <YAxis allowDecimals={false} tickFormatter={compact} stroke="var(--muted)" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltip} labelFormatter={value => grouping === "hour" ? `${shortDate(value)}, ${hour(value)}` : shortDate(value)} cursor={{ stroke: "var(--muted)", fill: "#929bad0b" }} formatter={(value, name, item) => [number(value), name === "previous" ? `Previous (${dateLabel(item.payload.previousDate)})` : type === "users" ? "New Login" : "Total orders"]} />
        {type === "users" ? <>
          {previousData && <Area dataKey="previous" type="monotone" stroke="var(--muted)" strokeDasharray="5 5" strokeWidth={1.5} fill="transparent" dot={false} isAnimationActive={false} />}
          {isCurrentDay && <ReferenceLine x={latest.date} stroke="var(--accent)" strokeDasharray="3 5" strokeOpacity={0.4} label={{ value: grouping === "hour" ? "Latest" : "Today", position: "insideTopRight", fill: "var(--accent)", fontSize: 11 }} />}
          <Area key={`users-${animationKey}`} className={ui("registration-series")} type="monotone" dataKey="users" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.07} strokeWidth={2.5} dot={props => <RegistrationDot {...props} key={props.index} latest={props.index === points.length - 1 && isCurrentDay} reduced={reduced} />} activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 3 }} isAnimationActive={false} animationDuration={650} animationEasing="ease-out" />
        </> : <>
          {previousData && <Bar dataKey="previous" fill="var(--muted)" fillOpacity={0.3} radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />}
          <Bar key={`orders-${animationKey}`} dataKey="orders" fill="var(--chart-order)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} animationDuration={800} animationEasing="ease-out" />
        </>}
      </Chart>
    </ResponsiveContainer>
  </div>;
}
export function StatusChart({ data, loading, error }) {
  if (loading) return <div className={ui("chart-skeleton skeleton")} />;
  if (error || !data?.length) return <EmptyState error={error} />;
  const total = data.reduce((sum, row) => sum + row.value, 0);
  return <div className={ui("status-content")}><div className={ui("donut-container")}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={63} outerRadius={79} paddingAngle={data.length > 1 ? 4 : 0} stroke="none" isAnimationActive={false} animationDuration={750}>{data.map(row => <Cell key={row.name} fill={statusColor(row.name)} />)}</Pie><Tooltip contentStyle={tooltip} /></PieChart></ResponsiveContainer><div className={ui("donut-label")}><strong>{number(total)}</strong><span>orders</span></div></div><div className={ui("status-legend")}>{data.map(row => <div key={row.name}><span className={ui("legend-dot")} style={{ background: statusColor(row.name) }} /><span>{row.name}</span><strong>{number(row.value)}</strong><small>{Math.round(row.value / total * 100)}%</small></div>)}</div></div>;
}

