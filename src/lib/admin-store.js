import { create } from "zustand";
import { DEFAULT_FILTERS } from "./analytics.js";
import { CUSTOMER_FILTERS } from "./customer-records.js";

export const SOURCE_LIMIT = 1000;
export const SOURCE_NAMES = ["users", "orders", "cart", "wishlist"];
const emptySource = () => ({
  rows: [],
  status: "idle",
  complete: false,
  error: "",
  updatedAt: null,
  fromCache: false,
  version: 0,
});
const emptySources = () =>
  Object.fromEntries(SOURCE_NAMES.map((name) => [name, emptySource()]));

// In-memory only: customer PII is never persisted to localStorage.
export const useAdminStore = create((set) => ({
  sources: emptySources(),
  requests: {},
  owner: null,
  refreshing: false,
  clock: 0,
  collapsed: false,
  overviewDraft: DEFAULT_FILTERS,
  overviewFilters: DEFAULT_FILTERS,
  customerFilters: CUSTOMER_FILTERS,
  setCustomerFilters: (value) =>
    set((state) => ({
      customerFilters:
        typeof value === "function" ? value(state.customerFilters) : value,
    })),
  setCollapsed: (value) =>
    set((state) => ({
      collapsed: typeof value === "function" ? value(state.collapsed) : value,
    })),
  setOverviewDraft: (value) => set({ overviewDraft: value }),
  setOverviewFilters: (value) => set({ overviewFilters: value }),
  resetSession: (owner) =>
    set({
      owner,
      clock: Date.now(),
      sources: emptySources(),
      requests: {},
      refreshing: false,
      customerFilters: CUSTOMER_FILTERS,
    }),
  setSource: (name, patch) =>
    set((state) => ({
      sources: {
        ...state.sources,
        [name]: { ...state.sources[name], ...patch },
      },
    })),
  receive: (name, rows, fromCache = false) =>
    set((state) => ({
      sources: {
        ...state.sources,
        [name]: {
          rows,
          complete: rows.length <= SOURCE_LIMIT,
          status: "ready",
          error: "",
          fromCache,
          updatedAt: fromCache ? state.sources[name].updatedAt : Date.now(),
          version: state.sources[name].version + 1,
        },
      },
      requests: {},
    })),
  tick: () => set({ clock: Date.now() }),
}));

// Used only by large-store cursor/aggregation fallbacks. Deduplicates in-flight reads.
export function cachedRequest(key, loader, maxAge = 60000) {
  const state = useAdminStore.getState(),
    cached = state.requests[key];
  if (cached?.promise) return cached.promise;
  if (cached && Date.now() - cached.at < maxAge)
    return Promise.resolve(cached.value);
  const owner = state.owner;
  const promise = loader()
    .then((value) => {
      const latest = useAdminStore.getState();
      if (latest.owner === owner && latest.requests[key]?.promise === promise) {
        useAdminStore.setState({
          requests: { ...latest.requests, [key]: { value, at: Date.now() } },
        });
      }
      return value;
    })
    .catch((error) => {
      const latest = useAdminStore.getState();
      if (latest.requests[key]?.promise === promise) {
        const requests = { ...latest.requests };
        delete requests[key];
        useAdminStore.setState({ requests });
      }
      throw error;
    });
  useAdminStore.setState({
    requests: { ...state.requests, [key]: { promise } },
  });
  return promise;
}
