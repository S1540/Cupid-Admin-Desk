import {
  collection,
  documentId,
  getCountFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";
import { cachedRequest } from "./admin-store";
import { normalizeCustomer } from "./customer-records";
export function fetchCustomerPage(cursor = null) {
  return cachedRequest(`customers:page:${cursor || "first"}`, async () => {
    const snapshot = await getDocsFromServer(
      query(
        collection(db, "users"),
        orderBy(documentId()),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(26),
      ),
    );
    return {
      rows: snapshot.docs
        .slice(0, 25)
        .map((doc) => normalizeCustomer({ id: doc.id, data: doc.data() })),
      cursor: snapshot.docs[24]?.id || null,
      hasMore: snapshot.size > 25,
    };
  });
}
export function fetchCustomerTotal() {
  return cachedRequest(
    "customers:total",
    async () =>
      (await getCountFromServer(collection(db, "users"))).data().count,
  );
}
