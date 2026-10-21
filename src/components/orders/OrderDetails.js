"use client";
import { ui } from "@/lib/ui";

import { useEffect, useRef } from "react";
import { Package, Truck, X } from "lucide-react";
import { dateTime } from "@/lib/formatters";
import { orderAmount } from "@/lib/order-records";

export default function OrderDetails({ order, onClose }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!order) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current.querySelector("button")?.focus();
    function key(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = [...panel.current.querySelectorAll('button, a, input, [tabindex="0"]')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", key); previous?.focus(); };
  }, [order, onClose]);
  if (!order) return null;
  return <div className={ui("order-modal-backdrop")} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={ui("order-details")} ref={panel} role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
      <header><div><span className={ui("eyebrow")}>ORDER DETAILS</span><h2 id="order-detail-title">{order.reference}</h2><p>{dateTime(order.createdAt)}</p></div><button className={ui("icon-button")} aria-label="Close order details" onClick={onClose}><X size={20} /></button></header>
      <div className={ui("order-detail-content")} tabIndex={0}>
        <dl className={ui("order-facts")}><div><dt>Order status</dt><dd>{order.status || "Not recorded"}</dd></div><div><dt>Payment status</dt><dd>{order.paymentStatus || "Not recorded"}{order.paymentSource === "Order status" && <small>From the recorded order status</small>}</dd></div>{order.paymentMethod && <div><dt>Payment method</dt><dd>{order.paymentMethod}</dd></div>}<div><dt>Price</dt><dd>{orderAmount(order.amount, order.currency)}</dd></div>{order.customer && <div><dt>Customer</dt><dd>{order.customer}</dd></div>}{order.location && <div><dt>Delivery location</dt><dd>{order.location}</dd></div>}<div className={ui("order-id-fact")}><dt>Record ID</dt><dd>{order.id}</dd></div></dl>
        <section className={ui("detail-section")}><h3><Package size={16} />Products <span>{order.products.length} entries</span></h3>{order.products.length ? <ul className={ui("order-products")}>{order.products.map((product, index) => <li key={index}><span className={ui("product-icon")}><Package size={18} /></span><div><strong>{product.title}</strong>{product.variant && <small>{product.variant}</small>}<small>{product.quantity != null ? `Quantity: ${product.quantity}` : "Quantity not recorded"}</small></div>{product.price != null && <span>{orderAmount(product.price, order.currency)}</span>}</li>)}</ul> : <p className={ui("order-field-note")}>Product details are not recorded for this order.</p>}</section>
        <section className={ui("detail-section")}><h3><Truck size={16} />Delivery & tracking</h3>{order.delivery || order.courier || order.awb ? <dl className={ui("order-facts")}><div><dt>Delivery status</dt><dd>{order.delivery || "Not recorded"}</dd></div>{order.courier && <div><dt>Courier</dt><dd>{order.courier}</dd></div>}{order.awb && <div><dt>AWB / tracking number</dt><dd>{order.awb}</dd></div>}{order.estimatedDelivery && <div><dt>Estimated delivery</dt><dd>{order.estimatedDelivery}</dd></div>}{order.trackingUpdatedAt && <div><dt>Tracking updated</dt><dd>{dateTime(order.trackingUpdatedAt)}</dd></div>}</dl> : <p className={ui("order-field-note")}>Tracking details will appear when recorded and refreshed.</p>}{order.deliveryIssue && <p className={ui("delivery-issue")}>{order.deliveryIssue}</p>}
          {order.trackingHistory.length > 0 && <div className={ui("tracking-events")}><h4>Recorded tracking events</h4>{order.trackingHistory.map((event, index) => <div key={index}><i /><strong>{event.status || "Tracking update"}</strong>{event.time && <time>{event.time}</time>}{event.location && <small>{event.location}</small>}</div>)}</div>}
        </section>
      </div>
      <footer>Read-only order record. Refresh the list to see new updates.</footer>
    </section>
  </div>;
}

