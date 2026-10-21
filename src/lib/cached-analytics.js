import { makeBuckets, reportingPeriods } from "./analytics.js";
export const timestampMillis = (value) =>
  typeof value?.toMillis === "function" && Number.isFinite(value.toMillis())
    ? value.toMillis()
    : null;
const ok = (value) => ({ value });
const failed = (error) => ({ value: null, error });
const inPeriod = (value, period) =>
  value != null &&
  (!period.start || value >= +period.start) &&
  value < +period.end;
function series(rows, period, field) {
  const dates = rows
    .map((row) => timestampMillis(row.data.createdAt))
    .filter((value) => inPeriod(value, period));
  const start =
    period.start || (dates.length ? new Date(Math.min(...dates)) : null);
  if (!start) return { points: [], grouping: "day" };
  const { buckets, grouping } = makeBuckets(start, period.end);
  return {
    grouping,
    points: buckets.map((bucket) => ({
      date: +bucket.start,
      [field]: dates.filter(
        (value) => value >= +bucket.start && value < +bucket.end,
      ).length,
    })),
  };
}
export function buildCachedDashboard(sources, filters, now = new Date()) {
  const { range, previous } = reportingPeriods(filters, now);
  const available = (name, calculate) => {
    const source = sources[name];
    if (source.status === "error") return failed(source.error);
    if (!source.complete)
      return failed(
        `This ${name} collection exceeds the live cache limit. Use indexed analytics for this range.`,
      );
    try {
      return ok(calculate(source.rows));
    } catch (error) {
      return failed(error.message);
    }
  };
  const users = (rows) =>
    rows.filter(
      (row) =>
        filters.verification === "all" ||
        row.data.emailVerified === (filters.verification === "verified"),
    );
  const orders = (rows, period) =>
    rows.filter(
      (row) =>
        (!period.start ||
          inPeriod(timestampMillis(row.data.createdAt), period)) &&
        (filters.status === "all" || row.data.status === filters.status),
    );
  const metrics = (period) => ({
    newUsers: available(
      "users",
      (rows) =>
        users(rows).filter(
          (row) =>
            !period.start ||
            inPeriod(timestampMillis(row.data.createdAt), period),
        ).length,
    ),
    periodOrders: available("orders", (rows) => orders(rows, period).length),
    pendingOrders: available(
      "orders",
      (rows) =>
        orders(rows, period).filter((row) => row.data.status === "pending")
          .length,
    ),
    paidOrders: available(
      "orders",
      (rows) =>
        orders(rows, period).filter((row) => row.data.status === "paid").length,
    ),
    registrations: available("users", (rows) =>
      series(users(rows), period, "users"),
    ),
    orders: available("orders", (rows) => {
      const selected = orders(rows, period);
      const counts = new Map();
      selected.forEach((row) => {
        const status =
          typeof row.data.status === "string" && row.data.status.trim()
            ? row.data.status
            : "Status not recorded";
        counts.set(status, (counts.get(status) || 0) + 1);
      });
      return {
        ...series(selected, period, "orders"),
        count: selected.length,
        availableStatuses: [
          ...new Set(
            rows
              .map((row) => row.data.status)
              .filter((value) => typeof value === "string" && value.trim()),
          ),
        ].sort(),
        statuses: [...counts].map(([name, value]) => ({ name, value })),
      };
    }),
  });
  const current = metrics(range);
  return {
    ...current,
    range,
    previous,
    refreshedAt: Math.max(
      ...Object.values(sources).map((source) => source.updatedAt || 0),
    ),
    cart: available("cart", (rows) => rows.length),
    wishlist: available("wishlist", (rows) => rows.length),
    comparison: ok(previous ? metrics(previous) : null),
    recent: available("users", (rows) => {
      const selected = users(rows)
        .filter((row) => inPeriod(timestampMillis(row.data.createdAt), range))
        .sort(
          (a, b) =>
            timestampMillis(b.data.createdAt) -
              timestampMillis(a.data.createdAt) || a.id.localeCompare(b.id),
        );
      const mapped = selected.map((row) => ({
        id: row.id,
        fullName: row.data.fullName || row.data.userName || "Name not provided",
        email: row.data.email || "Email not provided",
        verified: row.data.emailVerified,
        createdAt: timestampMillis(row.data.createdAt),
      }));
      return {
        rows: mapped.slice(0, 6),
        hasMore: mapped.length > 6,
        next: { cachedRows: mapped, offset: 6 },
      };
    }),
  };
}
