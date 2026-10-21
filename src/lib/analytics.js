export const DATE_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 10 days",
  "Last 30 days",
  "This month",
  "Last month",
  "All time",
  "Custom range",
];
export const DEFAULT_FILTERS = {
  range: "Last 30 days",
  start: "",
  end: "",
  verification: "all",
  status: "all",
  compare: false,
};
export function resolveRange(filters, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start = new Date(today),
    end = new Date(today);
  end.setDate(end.getDate() + 1);
  switch (filters.range) {
    case "Yesterday":
      start.setDate(start.getDate() - 1);
      end = today;
      break;
    case "Last 7 days":
      start.setDate(start.getDate() - 6);
      break;
    case "Last 10 days":
      start.setDate(start.getDate() - 9);
      break;
    case "Last 30 days":
      start.setDate(start.getDate() - 29);
      break;
    case "This month":
      start.setDate(1);
      break;
    case "Last month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "All time":
      start = null;
      end = new Date(now);
      break;
    case "Custom range":
      start = new Date(`${filters.start}T00:00:00`);
      end = new Date(`${filters.end}T00:00:00`);
      if (!Number.isFinite(+start) || !Number.isFinite(+end) || start > end)
        throw new Error("Choose a valid start and end date.");
      end.setDate(end.getDate() + 1);
      break;
  }
  return { start, end };
}
export function makeBuckets(start, end) {
  const days = Math.ceil((end - start) / 86400000);
  const grouping =
    days <= 1 ? "hour" : days > 90 ? "month" : days > 31 ? "week" : "day";
  const buckets = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (grouping === "hour")
    cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
    );
  if (grouping === "month")
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  while (cursor < end && buckets.length < 120) {
    const next = new Date(cursor);
    if (grouping === "hour") next.setTime(next.getTime() + 3600000);
    else if (grouping === "month") next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + (grouping === "week" ? 7 : 1));
    buckets.push({
      start: new Date(Math.max(+cursor, +start)),
      end: new Date(Math.min(+next, +end)),
    });
    cursor = next;
  }
  if (cursor < end)
    throw new Error(
      "This history is too large for live charts. Choose a shorter date range.",
    );
  return { grouping, buckets };
}

export function reportingPeriods(filters, now = new Date()) {
  const requested = resolveRange(filters, now);
  const range = { ...requested, end: new Date(Math.min(+requested.end, +now)) };
  if (range.start && range.start >= range.end)
    throw new Error("Choose a date range that has already started.");
  if (!filters.compare || !range.start) return { range, previous: null };
  const calendar = (date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round(
    (calendar(requested.end) - calendar(requested.start)) / 86400000,
  );
  const shift = (date) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() - days);
    return copy;
  };
  return {
    range,
    previous: { start: shift(range.start), end: shift(range.end) },
  };
}

export function compareValues(current, previous) {
  if (current == null || previous == null) return null;
  const difference = current - previous;
  if (previous === 0)
    return {
      difference,
      percent: null,
      label: current === 0 ? "No change" : `+${current} from zero`,
    };
  const percent = (difference / previous) * 100;
  return {
    difference,
    percent,
    label:
      difference === 0
        ? "No change"
        : `${percent > 0 ? "+" : ""}${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(percent)}%`,
  };
}
