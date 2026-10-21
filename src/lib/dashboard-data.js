import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { makeBuckets, reportingPeriods } from "./analytics";

const users = () => collection(db, "users");
const orders = () => collectionGroup(db, "orders");
const inFlight = new Map();
async function waitForServer(request) {
  let timer;
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Object.assign(
                new Error(
                  "Firestore did not respond within 30 seconds. Check your connection and retry.",
                ),
                { code: "deadline-exceeded" },
              ),
            ),
          30000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export function explainError(error) {
  if (error.code === "permission-denied")
    return "Firestore denied this read. Your signed-in admin needs list/read access to users and collection-group access to orders, cart and wishlist. Keep rules restricted to authorized admins.";
  if (error.code === "failed-precondition")
    return "A Firestore index is required for this query. Enable the createdAt collection-group index for orders; combined filters may also require a composite index. See the Firebase console query error for the exact index.";
  if (["unavailable", "deadline-exceeded"].includes(error.code))
    return "Firestore could not be reached. Check your connection and retry.";
  return error.message || "Unable to load this data. Please retry.";
}
async function count(ref, constraints = []) {
  return (await getCountFromServer(query(ref, ...constraints))).data().count;
}
function dates(range) {
  return [
    where(
      "createdAt",
      ">=",
      Timestamp.fromDate(range.start || new Date("0001-01-01T00:00:00Z")),
    ),
    where("createdAt", "<", Timestamp.fromDate(range.end)),
  ];
}
function segment(filters) {
  return filters.verification === "all"
    ? []
    : [where("emailVerified", "==", filters.verification === "verified")];
}
async function result(task) {
  try {
    return { value: await task() };
  } catch (error) {
    return { value: null, error: explainError(error) };
  }
}
async function segmentDocuments(filters, range) {
  const snapshot = await getDocsFromServer(
    query(users(), ...segment(filters), limit(1001)),
  );
  if (snapshot.size > 1000)
    throw new Error(
      "This customer segment needs a Firestore composite index on emailVerified and createdAt. More than 1,000 records were found; partial analytics are not displayed.",
    );
  return snapshot.docs
    .filter((doc) => {
      const stamp = doc.data().createdAt;
      return (
        stamp instanceof Timestamp &&
        (!range.start || stamp.toMillis() >= +range.start) &&
        stamp.toMillis() < +range.end
      );
    })
    .sort(
      (a, b) =>
        b.data().createdAt.toMillis() - a.data().createdAt.toMillis() ||
        a.id.localeCompare(b.id),
    );
}
function segmentTrend(documents, range) {
  if (!documents.length) return { points: [], grouping: "day" };
  const start = range.start || documents.at(-1).data().createdAt.toDate();
  const { buckets, grouping } = makeBuckets(start, range.end);
  return {
    grouping,
    points: buckets.map((bucket) => ({
      date: +bucket.start,
      users: documents.filter(
        (doc) =>
          doc.data().createdAt.toMillis() >= +bucket.start &&
          doc.data().createdAt.toMillis() < +bucket.end,
      ).length,
    })),
  };
}
async function registrationTrend(range, filters) {
  let start = range.start;
  if (!start) {
    const first = await getDocsFromServer(
      query(
        users(),
        ...dates(range),
        ...segment(filters),
        orderBy("createdAt", "asc"),
        limit(1),
      ),
    );
    if (first.empty) return { points: [], grouping: "day" };
    start = first.docs[0].data().createdAt.toDate();
  }
  const { buckets, grouping } = makeBuckets(start, range.end);
  const points = [];
  // Bound concurrent aggregation requests. No full customer collection download.
  for (let i = 0; i < buckets.length; i += 6) {
    points.push(
      ...(await Promise.all(
        buckets
          .slice(i, i + 6)
          .map(async (bucket) => ({
            date: +bucket.start,
            users: await count(users(), [
              ...dates(bucket),
              ...segment(filters),
            ]),
          })),
      )),
    );
  }
  return { points, grouping };
}
async function orderData(range, filters, fallback) {
  let snapshot;
  try {
    snapshot = await getDocsFromServer(
      query(
        orders(),
        ...dates(range),
        orderBy("createdAt", "desc"),
        limit(1001),
      ),
    );
  } catch (error) {
    if (error.code !== "failed-precondition") throw error;
    // Safe fallback for small stores lacking the collection-group date index.
    // Never present a truncated collection as a complete analytics result.
    snapshot = await fallback();
    if (snapshot.size > 1000) throw error;
  }
  if (snapshot.size > 1000)
    throw new Error(
      "More than 1,000 orders in this range. Choose a shorter range for complete order charts; aggregate totals remain accurate.",
    );
  if (
    snapshot.docs.some(
      (doc) => !/^users\/[^/]+\/orders\/[^/]+$/.test(doc.ref.path),
    )
  )
    throw new Error(
      "Order collection-group contains other paths. A scoped analytics index is needed.",
    );
  const allRecords = snapshot.docs
    .filter((doc) => doc.data().createdAt instanceof Timestamp)
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().getTime(),
    }))
    .filter(
      (row) =>
        (!range.start || row.createdAt >= +range.start) &&
        row.createdAt < +range.end,
    );
  const availableStatuses = [
    ...new Set(
      allRecords
        .map((row) => row.status)
        .filter((value) => typeof value === "string" && value.trim()),
    ),
  ].sort();
  const records =
    filters.status === "all"
      ? allRecords
      : allRecords.filter((row) => row.status === filters.status);
  const start =
    range.start ||
    (records.length
      ? new Date(Math.min(...records.map((row) => row.createdAt)))
      : range.end);
  const { buckets, grouping } = makeBuckets(start, range.end);
  const points = buckets.map((bucket) => ({
    date: +bucket.start,
    orders: records.filter(
      (row) => row.createdAt >= +bucket.start && row.createdAt < +bucket.end,
    ).length,
  }));
  const statuses = new Map();
  records.forEach((row) => {
    const status =
      typeof row.status === "string" && row.status.trim()
        ? row.status
        : "Status not recorded";
    statuses.set(status, (statuses.get(status) || 0) + 1);
  });
  return {
    count: records.length,
    points,
    grouping,
    availableStatuses,
    statuses: [...statuses].map(([name, value]) => ({ name, value })),
  };
}
function customerRow(doc) {
  const fields = doc.data();
  return {
    id: doc.id,
    fullName: fields.fullName || fields.userName || "Name not provided",
    email: fields.email || "Email not provided",
    verified: fields.emailVerified,
    createdAt:
      fields.createdAt instanceof Timestamp
        ? fields.createdAt.toMillis()
        : null,
  };
}
function fallbackPage(documents, offset = 0) {
  return {
    rows: documents.slice(offset, offset + 6).map(customerRow),
    next: { fallbackDocs: documents, offset: offset + 6 },
    hasMore: documents.length > offset + 6,
  };
}
export async function fetchRecentUsers(
  filters,
  cursor = null,
  fallback = null,
) {
  if (cursor?.cachedRows)
    return {
      rows: cursor.cachedRows.slice(cursor.offset, cursor.offset + 6),
      next: { ...cursor, offset: cursor.offset + 6 },
      hasMore: cursor.cachedRows.length > cursor.offset + 6,
    };
  const range = filters.anchor || reportingPeriods(filters).range;
  if (cursor?.fallbackDocs)
    return fallbackPage(cursor.fallbackDocs, cursor.offset);
  try {
    const snapshot = await getDocsFromServer(
      query(
        users(),
        ...dates(range),
        ...segment(filters),
        orderBy("createdAt", "desc"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(7),
      ),
    );
    return {
      rows: snapshot.docs.slice(0, 6).map(customerRow),
      next: snapshot.docs[5] || null,
      hasMore: snapshot.size > 6,
    };
  } catch (error) {
    if (error.code !== "failed-precondition" || cursor) throw error;
    return fallbackPage(
      await (fallback ? fallback() : segmentDocuments(filters, range)),
    );
  }
}
export function fetchDashboard(filters) {
  const key = JSON.stringify(filters);
  if (inFlight.has(key)) return waitForServer(inFlight.get(key));
  const promise = (async () => {
    const { range, previous } = reportingPeriods(filters);
    let fallbackPromise;
    const fallback = () =>
      (fallbackPromise ||= getDocsFromServer(query(orders(), limit(1001))));
    const segmentCache = new Map();
    const orderCache = new Map();
    const rangeKey = (period) =>
      `${period.start?.getTime() || 0}-${period.end.getTime()}`;
    const loadSegment = (period) => {
      const key = rangeKey(period);
      if (!segmentCache.has(key))
        segmentCache.set(key, segmentDocuments(filters, period));
      return segmentCache.get(key);
    };
    const loadOrders = (period) => {
      const key = rangeKey(period);
      if (!orderCache.has(key))
        orderCache.set(key, orderData(period, filters, fallback));
      return orderCache.get(key);
    };
    async function customers(period) {
      try {
        return await count(users(), [
          ...(period.start ? dates(period) : []),
          ...segment(filters),
        ]);
      } catch (error) {
        if (error.code !== "failed-precondition") throw error;
        return (await loadSegment(period)).length;
      }
    }
    async function orderCount(period, requiredStatus = null) {
      if (
        requiredStatus &&
        filters.status !== "all" &&
        filters.status !== requiredStatus
      )
        return 0;
      const status =
        requiredStatus || (filters.status === "all" ? null : filters.status);
      try {
        return await count(orders(), [
          ...(period.start ? dates(period) : []),
          ...(status ? [where("status", "==", status)] : []),
        ]);
      } catch (error) {
        if (error.code !== "failed-precondition") throw error;
        if (period.start) {
          const info = await loadOrders(period);
          return status
            ? info.statuses.find((row) => row.name === status)?.value || 0
            : info.count;
        }
        const snapshot = await fallback();
        if (snapshot.size > 1000) throw error;
        return snapshot.docs.filter(
          (doc) => !status || doc.data().status === status,
        ).length;
      }
    }
    async function trend(period) {
      try {
        return await registrationTrend(period, filters);
      } catch (error) {
        if (error.code !== "failed-precondition") throw error;
        return segmentTrend(await loadSegment(period), period);
      }
    }
    const metricTasks = (period) => ({
      newUsers: () => customers(period),
      periodOrders: () => orderCount(period),
      pendingOrders: () => orderCount(period, "pending"),
      paidOrders: () => orderCount(period, "paid"),
    });
    const runTasks = async (tasks) =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(tasks).map(async ([name, task]) => [
            name,
            await result(task),
          ]),
        ),
      );
    const tasks = {
      ...metricTasks(range),
      cart: () => count(collectionGroup(db, "cart")),
      wishlist: () => count(collectionGroup(db, "wishlist")),
      registrations: () => trend(range),
      orders: () => loadOrders(range),
      recent: () =>
        fetchRecentUsers({ ...filters, anchor: range }, null, () =>
          loadSegment(range),
        ),
      comparison: () =>
        previous
          ? runTasks({
              ...metricTasks(previous),
              registrations: () => trend(previous),
              orders: () => loadOrders(previous),
            })
          : null,
    };
    return {
      ...(await runTasks(tasks)),
      range,
      previous,
      refreshedAt: Date.now(),
    };
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return waitForServer(promise);
}
