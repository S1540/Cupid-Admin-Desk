import { jsPDF } from "jspdf";
import { dateTime } from "./formatters";

export async function downloadOrderPdf(order) {
  const pdf = new jsPDF();
  let y = 25;
  const line = (text, size = 11, color = [36, 46, 62]) => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(String(text), 170);
    for (const entry of lines) {
      if (y > 270) {
        pdf.addPage();
        y = 24;
      }
      pdf.text(entry, 20, y);
      y += size * 0.5 + 2;
    }
  };
  pdf.setFillColor(248, 115, 135);
  pdf.rect(20, 15, 12, 1.2, "F");
  line("CUPID CLOTHINGS", 11, [110, 120, 136]);
  line(`Order ${order.reference}`, 23);
  line("Order record / Not a tax invoice", 10, [110, 120, 136]);
  y += 6;
  for (const [label, value] of [
    ["Created", dateTime(order.createdAt)],
    ["Order status", order.status],
    ["Payment", order.paymentStatus],
    ["Payment source", order.paymentSource],
    ["Payment method", order.paymentMethod],
    ["Delivery", order.delivery],
    ["Customer", order.customer],
    ["Location", order.location],
    [
      "Price",
      order.amount == null
        ? null
        : `${order.currency || ""} ${new Intl.NumberFormat("en-IN").format(order.amount)}`.trim(),
    ],
    ["Courier", order.courier],
    ["Tracking number", order.awb],
  ]) {
    if (value) line(`${label}: ${value}`);
  }
  y += 7;
  line("Products", 14);
  for (const item of order.products) {
    line(item.title);
    if (item.variant) line(item.variant, 10, [110, 120, 136]);
    line(
      `Quantity: ${item.quantity ?? "Not recorded"} | Price: ${item.price ?? "Not recorded"}`,
      10,
    );
    y += 3;
  }
  y += 5;
  line(`Exported: ${dateTime(Date.now())}`, 9, [110, 120, 136]);
  line(`Record ID: ${order.id}`, 9, [110, 120, 136]);
  pdf.save(
    `Cupid-Order-${order.reference.replace(/[^a-zA-Z0-9_-]/g, "") || "record"}.pdf`,
  );
}
