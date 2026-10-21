// Optional payment fields are displayed only when a value is actually stored.
const text = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const numeric = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const timestamp = (value) =>
  typeof value?.toMillis === "function" ? value.toMillis() : null;
export function normalizeOrder(id, fields, key = id) {
  const address = fields.shippingAddress || {};
  const status = text(fields.status);
  const explicitPayment =
    text(fields.paymentStatus) ||
    text(fields.payment_status) ||
    text(fields.payment?.status);
  const paymentMethod =
    text(fields.paymentMethod) ||
    text(fields.payment_method) ||
    text(fields.payment?.method) ||
    (fields.isCOD === true || fields.cod === true ? "COD" : null);
  const products = Array.isArray(fields.products)
    ? fields.products
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          title: text(item.title) || "Product name not recorded",
          variant: text(item.variant_title),
          quantity: numeric(item.quantity),
          price:
            numeric(item.price) ??
            (text(item.price) && Number.isFinite(Number(item.price))
              ? Number(item.price)
              : null),
        }))
    : [];
  return {
    id,
    key,
    editValues: {
      status: status || "",
      payment: explicitPayment || "",
      delivery:
        text(fields.trackingStatus) || text(fields.deliveryStatus) || "",
    },
    paymentField: text(fields.paymentStatus)
      ? "paymentStatus"
      : text(fields.payment_status)
        ? "payment_status"
        : text(fields.payment?.status)
          ? "payment.status"
          : "paymentStatus",
    deliveryField: text(fields.trackingStatus)
      ? "trackingStatus"
      : text(fields.deliveryStatus)
        ? "deliveryStatus"
        : "trackingStatus",
    adminUpdatedAt: timestamp(fields.adminStatusUpdatedAt),
    reference:
      text(fields.shopifyName) ||
      (numeric(fields.orderNumber) != null
        ? `#${fields.orderNumber}`
        : text(fields.orderId) || id),
    orderId: text(fields.orderId),
    createdAt: timestamp(fields.createdAt),
    confirmedAt: timestamp(fields.orderConfirmedAt),
    customer:
      text(address.name) ||
      [text(address.first_name), text(address.last_name)]
        .filter(Boolean)
        .join(" ") ||
      null,
    location: [
      text(address.city),
      text(address.province),
      text(address.country),
    ]
      .filter(Boolean)
      .join(", "),
    status,
    amount: numeric(fields.total),
    currency: text(fields.currency) || text(fields.currencyCode),
    paymentStatus:
      explicitPayment ||
      (status?.toLowerCase() === "paid" ? "Marked paid" : null),
    paymentSource: explicitPayment
      ? "Payment field"
      : status?.toLowerCase() === "paid"
        ? "Order status"
        : null,
    paymentMethod,
    delivery: text(fields.trackingStatus) || text(fields.deliveryStatus),
    courier: text(fields.courier),
    awb: text(fields.awb),
    estimatedDelivery: text(fields.estimatedDeliveryDate),
    trackingUpdatedAt: timestamp(fields.trackingUpdatedAt),
    deliveryIssue:
      text(fields.undeliveredReason) || text(fields.pickupExceptionReason),
    trackingHistory: Array.isArray(fields.trackingHistory)
      ? fields.trackingHistory
          .filter((event) => event && typeof event === "object")
          .map((event) => ({
            status:
              text(event.status) ||
              text(event["sr-status-label"]) ||
              text(event.activity),
            time: text(event.time) || text(event.date),
            location: text(event.location),
          }))
          .filter((event) => event.status || event.time)
      : [],
    products,
  };
}
export function orderAmount(amount, currency) {
  if (amount == null) return "Not recorded";
  if (currency && /^[A-Za-z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      /* Preserve the stored amount when currency is not recognized. */
    }
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    amount,
  );
}
export function filterOrders(rows, filters) {
  const search = filters.search.trim().toLowerCase();
  const localDate = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const start = filters.start ? +localDate(filters.start) : null;
  const endDate = filters.end ? localDate(filters.end) : null;
  if (endDate) endDate.setDate(endDate.getDate() + 1);
  return rows.filter(
    (row) =>
      (start == null || (row.createdAt != null && row.createdAt >= start)) &&
      (!endDate || (row.createdAt != null && row.createdAt < +endDate)) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.delivery || row.delivery === filters.delivery) &&
      (!filters.payment || row.paymentStatus === filters.payment) &&
      (!filters.method || row.paymentMethod === filters.method) &&
      (!search ||
        [
          row.reference,
          row.orderId,
          row.id,
          row.customer,
          row.awb,
          ...row.products.map((item) => item.title),
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search))),
  );
}
