"use client";
import { useEffect, useMemo, useState } from "react";
import { useAdminStore, cachedRequest } from "./admin-store";
import { buildCachedDashboard } from "./cached-analytics";
import { fetchDashboard } from "./dashboard-data";

export function useDashboardData(filters) {
  const sources = useAdminStore((state) => state.sources);
  const clock = useAdminStore((state) => state.clock);
  const refreshing = useAdminStore((state) => state.refreshing);
  const pending = Object.values(sources).some((source) =>
    ["idle", "loading"].includes(source.status),
  );
  const oversized = Object.values(sources).some(
    (source) => source.status === "ready" && !source.complete,
  );
  const key = JSON.stringify(filters);
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    if (pending || !oversized) return;
    let active = true;
    cachedRequest(`overview:${key}`, () => fetchDashboard(JSON.parse(key)))
      .then((value) => {
        if (active) setRemote({ key, value });
      })
      .catch((error) => {
        if (active) setRemote({ key, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [pending, oversized, key, sources, clock]);
  const data = useMemo(() => {
    if (pending || oversized) return null;
    const now = Math.max(
      clock,
      ...Object.values(sources).map((source) => source.updatedAt || 0),
    );
    return buildCachedDashboard(sources, filters, new Date(now));
    // clock updates elapsed periods and midnight without a Firestore request.
  }, [pending, oversized, sources, filters, clock]);
  return {
    data: oversized ? (remote?.key === key ? remote.value : null) : data,
    loading: refreshing || pending || (oversized && remote?.key !== key),
    error: oversized && remote?.key === key ? remote.error || "" : "",
    cached: Object.values(sources).some((source) => source.fromCache),
    oversized,
  };
}
