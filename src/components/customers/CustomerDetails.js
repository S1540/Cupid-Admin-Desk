"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Heart, Package, ShoppingBag, X } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { normalizeCustomer } from "@/lib/customer-records";
import { normalizeOrder, orderAmount } from "@/lib/order-records";
import { dateTime, number } from "@/lib/formatters";
import { ui } from "@/lib/ui";
const fieldLabel = (value) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
function valueText(value) {
  if (value == null || value === "") return "Not recorded";
  if (typeof value?.toMillis === "function") return dateTime(value.toMillis());
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object")
    return JSON.stringify(
      value,
      (key, item) => (/token|password|secret/i.test(key) ? undefined : item),
      2,
    );
  return String(value);
}
export default function CustomerDetails({ customer, onClose }) {
  const sources = useAdminStore((state) => state.sources);
  const live = sources.users.rows.find((row) => row.id === customer.id);
  const current = live ? normalizeCustomer(live) : customer;
  const deleted =
    sources.users.complete && sources.users.status === "ready" && !live;
  const [tab, setTab] = useState("profile"),
    [copied, setCopied] = useState(false);
  const dialog = useRef(null);
  function moveTab(event) {
    const keys = ["profile", "orders", "saved"];
    let next;
    if (event.key === "ArrowRight")
      next = keys[(keys.indexOf(tab) + 1) % keys.length];
    if (event.key === "ArrowLeft")
      next = keys[(keys.indexOf(tab) + keys.length - 1) % keys.length];
    if (event.key === "Home") next = keys[0];
    if (event.key === "End") next = keys.at(-1);
    if (!next) return;
    event.preventDefault();
    setTab(next);
    dialog.current.querySelector(`#customer-tab-${next}`).focus();
  }
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const owned = (name) =>
    sources[name].rows.filter((row) => row.path.split("/")[1] === customer.id);
  const available = (name) =>
    sources[name].complete && sources[name].status === "ready";
  const orders = owned("orders")
    .map((row) => normalizeOrder(row.id, row.data, row.path))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  async function copy() {
    try {
      await navigator.clipboard.writeText(current.id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="customer-detail-title"
      onCancel={onClose}
      className="fixed inset-y-0 right-0 left-auto m-0 flex h-dvh max-h-none w-[min(620px,100%)] max-w-none flex-col border-l border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div className="min-w-0">
          <span className="text-[10px] tracking-[1.6px] text-muted">
            CUSTOMER PROFILE
          </span>
          <h2
            id="customer-detail-title"
            className="mt-2 text-xl font-semibold break-words"
          >
            {current.name || "Name not provided"}
          </h2>
          <p className="mt-1 text-xs text-muted break-all">
            {current.email || "Email not recorded"}
          </p>
        </div>
        <button
          className={ui("icon-button")}
          aria-label="Close customer details"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <div
        className="flex border-b border-border px-6"
        role="tablist"
        aria-label="Customer details"
      >
        {[
          ["profile", "Profile"],
          ["orders", "Orders"],
          ["saved", "Saved items"],
        ].map(([key, label]) => (
          <button
            role="tab"
            id={`customer-tab-${key}`}
            tabIndex={tab === key ? 0 : -1}
            onKeyDown={moveTab}
            aria-selected={tab === key}
            aria-controls={`customer-panel-${key}`}
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors ${tab === key ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto p-6"
        role="tabpanel"
        id={`customer-panel-${tab}`}
        aria-labelledby={`customer-tab-${tab}`}
        tabIndex={0}
      >
        {deleted && (
          <p
            role="alert"
            className="mb-5 rounded border border-brand/30 p-3 text-xs text-brand"
          >
            This customer was removed from Firestore. The last viewed profile is
            shown.
          </p>
        )}
        {tab === "profile" && (
          <>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {[
                ["Orders", available("orders") ? orders.length : null],
                [
                  "Cart entries",
                  available("cart") ? owned("cart").length : null,
                ],
                [
                  "Wishlist",
                  available("wishlist") ? owned("wishlist").length : null,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded border border-border bg-elevated/40 p-3"
                >
                  <span className="text-[10px] text-muted">{label}</span>
                  <strong className="mt-1 block text-lg font-medium">
                    {number(value)}
                  </strong>
                </div>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-6 text-sm max-[400px]:grid-cols-1">
              {[
                ["Full name", current.name],
                ["Email", current.email],
                ["Phone", current.phone],
                [
                  "Email verification",
                  current.verified == null
                    ? "Not recorded"
                    : current.verified
                      ? "Verified"
                      : "Unverified",
                ],
                ["City", current.city],
                ["Country", current.country],
                ["Registered", dateTime(current.createdAt)],
                ["Profile updated", dateTime(current.updatedAt)],
                ["Cupid coins", current.coins],
                ["Onboarding", current.onboarding],
                ["Date of birth", current.fields.dob],
                ["Referral code", current.fields.referralCode],
                ["Total referrals", current.fields.totalReferrals],
                ["Wallet balance (recorded)", current.fields.walletBalance],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="mb-1.5 text-[11px] text-muted">{label}</dt>
                  <dd className="text-[13px] break-words">
                    {valueText(value)}
                  </dd>
                </div>
              ))}
            </dl>
            <details className="mt-7 border-t border-border pt-5">
              <summary className="text-xs font-medium text-muted">
                All stored profile fields
              </summary>
              <dl className="mt-4 space-y-4">
                {Object.entries(current.fields)
                  .filter(([key]) => !/token|password|secret/i.test(key))
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-[11px] text-muted">
                        {fieldLabel(key)}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-xs break-all">
                        {valueText(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </details>
          </>
        )}
        {tab === "orders" && (
          <>
            <p className="mb-4 text-xs leading-6 text-muted">
              Recorded orders and their current statuses. Amounts keep their
              stored currency.
            </p>
            {!available("orders") ? (
              <Unavailable source={sources.orders} />
            ) : !orders.length ? (
              <Empty text="No orders recorded for this customer." />
            ) : (
              orders.map((order) => (
                <details
                  key={order.key}
                  className="mb-3 rounded border border-border p-4"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                    <div>
                      <strong className="font-medium">{order.reference}</strong>
                      <p className="mt-1 text-[11px] text-muted">
                        {dateTime(order.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs text-muted">
                      {order.status || "Status not recorded"}
                    </span>
                  </summary>
                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
                    {[
                      ["Price", orderAmount(order.amount, order.currency)],
                      ["Payment", order.paymentStatus],
                      ["Delivery", order.delivery],
                      ["Courier", order.courier],
                    ].map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted">{key}</dt>
                        <dd className="mt-1">{value || "Not recorded"}</dd>
                      </div>
                    ))}
                  </dl>
                  {order.products.map((product, index) => (
                    <p className="mt-3 text-xs text-muted" key={index}>
                      {product.title}
                      {product.quantity != null ? ` × ${product.quantity}` : ""}
                    </p>
                  ))}
                </details>
              ))
            )}
          </>
        )}
        {tab === "saved" &&
          ["cart", "wishlist"].map((name) => (
            <section key={name} className="mb-7">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                {name === "cart" ? (
                  <ShoppingBag size={16} />
                ) : (
                  <Heart size={16} />
                )}{" "}
                {name === "cart" ? "Cart" : "Wishlist"}
                <span className="ml-auto text-xs text-muted">
                  {available(name)
                    ? `${owned(name).length} entries`
                    : "Unavailable"}
                </span>
              </h3>
              {!available(name) ? (
                <Unavailable source={sources[name]} />
              ) : !owned(name).length ? (
                <Empty text={`No ${name} entries recorded.`} />
              ) : (
                owned(name).map((row) => (
                  <div
                    key={row.path}
                    className="flex items-start gap-3 border-b border-border py-3"
                  >
                    <Package size={17} className="mt-1 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]">
                        {row.data.title || "Product name not recorded"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {row.data.size ? `Size: ${row.data.size} · ` : ""}
                        {row.data.quantity != null
                          ? `Quantity: ${row.data.quantity}`
                          : "Saved product"}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums">
                      {typeof row.data.price === "number"
                        ? number(row.data.price)
                        : "—"}
                    </span>
                  </div>
                ))
              )}
            </section>
          ))}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <span
          className="min-w-0 truncate text-[10px] text-muted"
          title={current.id}
        >
          {current.id}
        </span>
        <button onClick={copy} className={ui("text-button")}>
          <span className="sr-only">Copy customer ID</span>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span aria-live="polite">{copied ? "Copied" : "Copy ID"}</span>
        </button>
      </footer>
    </dialog>
  );
}
function Empty({ text }) {
  return (
    <div className="rounded border border-dashed border-border px-4 py-8 text-center text-xs text-muted">
      {text}
    </div>
  );
}
function Unavailable({ source }) {
  return (
    <p className="text-xs leading-6 text-muted">
      {source.error ||
        "Complete activity is not available in the live cache. Refresh or open the corresponding module."}
    </p>
  );
}
