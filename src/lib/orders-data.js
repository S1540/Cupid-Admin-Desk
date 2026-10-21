import {
  collectionGroup,
  doc,
  documentId,
  getCountFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { normalizeOrder } from "./order-records";
import { assertUnchanged, orderChanges } from "./order-updates";

const SOURCE_LIMIT = 1000;
const ref = () => collectionGroup(db, "orders");
export async function updateOrderStatuses(order, draft) {
  if (!/^users\/[^/]+\/orders\/[^/]+$/.test(order.key))
    throw new Error("Invalid order path.");
  const changes = orderChanges(order.editValues, draft);
  if (!Object.keys(changes).length) return order;
  try {
    return await runTransaction(db, async (transaction) => {
      const reference = doc(db, order.key);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("This order no longer exists.");
      const latest = normalize(snapshot);
      assertUnchanged(order.editValues, latest.editValues, changes);
      const patch = {
        adminStatusUpdatedAt: serverTimestamp(),
        adminStatusUpdatedBy: auth.currentUser?.uid || null,
      };
      if (changes.status) patch.status = changes.status;
      if (changes.payment) patch[latest.paymentField] = changes.payment;
      if (changes.delivery) patch[latest.deliveryField] = changes.delivery;
      transaction.update(reference, patch);
      const fields = snapshot.data();
      for (const [key, value] of Object.entries(patch)) {
        if (key === "payment.status")
          fields.payment = { ...fields.payment, status: value };
        else if (!key.startsWith("adminStatus")) fields[key] = value;
      }
      // Render the committed status values; server timestamps resolve on refresh.
      return normalizeOrder(snapshot.id, fields, reference.path);
    });
  } catch (error) {
    if (error.code === "permission-denied")
      throw new Error(
        "Update denied. Your admin account needs Firestore read/update permission on this order, including adminStatusUpdatedAt and adminStatusUpdatedBy. Security rules were not changed.",
      );
    throw error;
  }
}
let currentRequest;
function normalize(doc) {
  if (!/^users\/[^/]+\/orders\/[^/]+$/.test(doc.ref.path))
    throw new Error(
      "An order was found outside the verified users/{user}/orders path. A scoped orders index is required.",
    );
  return normalizeOrder(doc.id, doc.data(), doc.ref.path);
}
async function withDeadline(request) {
  let timer;
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Orders did not respond within 30 seconds. Check your connection and retry.",
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
export async function fetchOrderPage(cursor = null, size = 25) {
  const snapshot = await withDeadline(
    getDocsFromServer(
      query(
        ref(),
        orderBy(documentId()),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(size + 1),
      ),
    ),
  );
  return {
    rows: snapshot.docs.slice(0, size).map(normalize),
    cursor: snapshot.docs[size - 1] || null,
    hasMore: snapshot.size > size,
  };
}
export function fetchOrderLedger() {
  if (!currentRequest)
    currentRequest = (async () => {
      const total = (await getCountFromServer(ref())).data().count;
      if (total > SOURCE_LIMIT)
        return {
          mode: "paged",
          total,
          ...(await fetchOrderPage()),
          refreshedAt: Date.now(),
        };
      // This complete, bounded read includes orders with missing dates. It also
      // works without the currently missing collection-group date index.
      const snapshot = await getDocsFromServer(
        query(ref(), orderBy(documentId()), limit(SOURCE_LIMIT + 1)),
      );
      if (snapshot.size > SOURCE_LIMIT)
        return {
          mode: "paged",
          total: (await getCountFromServer(ref())).data().count,
          ...(await fetchOrderPage()),
          refreshedAt: Date.now(),
        };
      const rows = snapshot.docs
        .map(normalize)
        .sort(
          (a, b) =>
            (b.createdAt ?? -Infinity) - (a.createdAt ?? -Infinity) ||
            a.key.localeCompare(b.key),
        );
      return {
        mode: "snapshot",
        total: rows.length,
        rows,
        hasMore: false,
        refreshedAt: Date.now(),
      };
    })().finally(() => {
      currentRequest = null;
    });
  return withDeadline(currentRequest);
}
