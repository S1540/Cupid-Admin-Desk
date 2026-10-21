import {
  collection,
  collectionGroup,
  documentId,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { SOURCE_LIMIT, SOURCE_NAMES, useAdminStore } from "./admin-store";

let stopSession;
let refreshPromise;
let generation = 0;
const sourceQuery = (name) =>
  query(
    name === "users" ? collection(db, "users") : collectionGroup(db, name),
    orderBy(documentId()),
    limit(SOURCE_LIMIT + 1),
  );
function withTimeout(request) {
  let timer;
  return Promise.race([
    request,
    new Promise((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              "Firestore did not respond. Check your connection and retry.",
            ),
          ),
        30000,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}
function message(error) {
  if (error.code === "permission-denied")
    return "Firestore denied access. Your admin account needs read access to users and the orders/cart/wishlist collection groups.";
  return (
    error.message ||
    "Could not connect to Firestore. Check your connection and retry."
  );
}
function receive(name, snapshot) {
  if (snapshot.metadata.hasPendingWrites) return;
  const current = useAdminStore.getState().sources[name];
  if (snapshot.metadata.fromCache && !current.updatedAt) return;
  if (
    name !== "users" &&
    snapshot.docs.some(
      (doc) => !new RegExp(`^users/[^/]+/${name}/[^/]+$`).test(doc.ref.path),
    )
  )
    throw new Error(
      `Unexpected ${name} path. A scoped collection index is required.`,
    );
  const rows = snapshot.docs.map((doc) => ({
    id: doc.id,
    path: doc.ref.path,
    data: doc.data(),
  }));
  useAdminStore.getState().receive(name, rows, snapshot.metadata.fromCache);
}
export function startAdminSync() {
  if (stopSession) return stopSession;
  let unsubscribeSources = [],
    timers = [],
    activeOwner;
  const stopSources = () => {
    unsubscribeSources.forEach((stop) => stop());
    timers.forEach(clearTimeout);
    unsubscribeSources = [];
    timers = [];
  };
  const startSources = (user) => {
    const owner = user?.uid || "anonymous";
    if (activeOwner === owner) return;
    activeOwner = owner;
    generation++;
    stopSources();
    useAdminStore.getState().resetSession(owner);
    for (const name of SOURCE_NAMES) {
      useAdminStore.getState().setSource(name, { status: "loading" });
      const timer = setTimeout(() => {
        if (useAdminStore.getState().sources[name].status === "loading")
          useAdminStore.getState().setSource(name, {
            status: "error",
            error:
              "Firestore has not responded. Check your connection and refresh.",
          });
      }, 30000);
      timers.push(timer);
      unsubscribeSources.push(
        onSnapshot(
          sourceQuery(name),
          { includeMetadataChanges: true },
          (snapshot) => {
            try {
              receive(name, snapshot);
              if (!snapshot.metadata.fromCache) clearTimeout(timer);
            } catch (error) {
              useAdminStore
                .getState()
                .setSource(name, { status: "error", error: message(error) });
            }
          },
          (error) => {
            clearTimeout(timer);
            useAdminStore
              .getState()
              .setSource(name, { status: "error", error: message(error) });
          },
        ),
      );
    }
  };
  const stopAuth = onAuthStateChanged(auth, startSources);
  const tick = setInterval(() => useAdminStore.getState().tick(), 60000);
  stopSession = () => {
    generation++;
    stopSources();
    stopAuth();
    clearInterval(tick);
    stopSession = null;
  };
  return stopSession;
}
export function refreshAdminData() {
  if (refreshPromise) return refreshPromise;
  const started = generation;
  useAdminStore.setState({ refreshing: true, requests: {} });
  refreshPromise = Promise.allSettled(
    SOURCE_NAMES.map(async (name) => {
      try {
        const snapshot = await withTimeout(
          getDocsFromServer(sourceQuery(name)),
        );
        if (started === generation) receive(name, snapshot);
      } catch (error) {
        if (started === generation)
          useAdminStore
            .getState()
            .setSource(name, { status: "error", error: message(error) });
      }
    }),
  ).finally(() => {
    refreshPromise = null;
    if (started === generation)
      useAdminStore.setState({ refreshing: false, clock: Date.now() });
  });
  return refreshPromise;
}
