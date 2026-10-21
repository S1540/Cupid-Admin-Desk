"use client";
import { ui } from "@/lib/ui";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { fetchRecentUsers, explainError } from "@/lib/dashboard-data";
import { dateTime } from "@/lib/formatters";
import ChartCard, { EmptyState } from "./ChartCard";

export default function RecentActivity({
  initial,
  filters,
  loading: parentLoading,
}) {
  const [pages, setPages] = useState(initial?.value ? [initial.value] : []);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initial?.error || "");
  const mounted = useRef(true);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = pages[index];
  async function next() {
    if (busy.current) return;
    if (pages[index + 1]) {
      setIndex(index + 1);
      return;
    }
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const page = await fetchRecentUsers(filters, current.next);
      if (mounted.current) {
        setPages([...pages, page]);
        setIndex(index + 1);
      }
    } catch (err) {
      if (mounted.current) setError(explainError(err));
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }
  return (
    <ChartCard
      title="Recent customers"
      subtitle="The latest people to join Cupid Clothings"
      aside={
        <span className={ui("tag")}>
          <Users size={12} />
          Registrations
        </span>
      }
      className={ui("recent-panel")}
    >
      {parentLoading ? (
        <div className={ui("table-loading")}>
          {[0, 1, 2, 3].map((i) => (
            <div className={ui("skeleton")} key={i} />
          ))}
        </div>
      ) : error && !current ? (
        <EmptyState error={error} />
      ) : !current?.rows.length ? (
        <EmptyState title="No registrations in this period" />
      ) : (
        <>
          <div className={ui("table-scroll")}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer ID</th>
                  <th>Registered</th>
                  <th>Email status</th>
                </tr>
              </thead>
              <tbody>
                {current.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={ui("customer-cell")}>
                        <span className={ui("customer-avatar")}>
                          {row.fullName.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{row.fullName}</strong>
                          <small>{row.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={ui("record-id")} title={row.id}>
                        {row.id.slice(0, 10)}-
                      </span>
                    </td>
                    <td>{dateTime(row.createdAt)}</td>
                    <td>
                      <span
                        className={ui(`status-badge ${row.verified === true ? "verified" : ""}`)}
                      >
                        <i />
                        {row.verified === true
                          ? "Verified"
                          : row.verified === false
                            ? "Unverified"
                            : "Not recorded"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && (
            <p className={ui("pagination-error")} role="alert">
              {error}
            </p>
          )}
          <div className={ui("table-footer")}>
            <span>
              Showing {index * 6 + 1}-{index * 6 + current.rows.length} - newest
              first
            </span>
            <div>
              <button
                className={ui("icon-button")}
                aria-label="Previous customer page"
                disabled={index === 0 || loading || parentLoading}
                onClick={() => {
                  setIndex(index - 1);
                  setError("");
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {index + 1}</span>
              <button
                className={ui("icon-button")}
                aria-label="Next customer page"
                disabled={!current.hasMore || loading || parentLoading}
                onClick={next}
              >
                {loading ? (
                  <span className={ui("small-spinner")} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}
