const text = (value) => (typeof value === "string" ? value.trim() : "");
const numeric = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
export const customerTimestamp = (value) =>
  typeof value?.toMillis === "function" && Number.isFinite(value.toMillis())
    ? value.toMillis()
    : null;
export const CUSTOMER_FILTERS = {
  search: "",
  verification: "all",
  country: "",
  city: "",
  onboarding: "",
  activity: "all",
  start: "",
  end: "",
  sort: "newest",
};
export const CUSTOMER_SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["az", "Name: A–Z"],
  ["za", "Name: Z–A"],
  ["coins-high", "Coins: high to low"],
  ["coins-low", "Coins: low to high"],
];
export function normalizeCustomer(row) {
  const fields = row.data;
  return {
    id: row.id,
    name: text(fields.fullName) || text(fields.userName),
    email: text(fields.email),
    phone: text(fields.phone),
    city: text(fields.city),
    country: text(fields.country),
    verified:
      typeof fields.emailVerified === "boolean" ? fields.emailVerified : null,
    createdAt: customerTimestamp(fields.createdAt),
    updatedAt: customerTimestamp(fields.updatedAt),
    coins: numeric(fields.cupidCoins),
    onboarding: text(fields.onboardingState),
    fields,
  };
}
const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});
export function filterCustomers(rows, filters, orderCounts = null) {
  const search = filters.search.trim().toLocaleLowerCase();
  const parse = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const start = filters.start ? +parse(filters.start) : null;
  const end = filters.end ? parse(filters.end) : null;
  if (end) end.setDate(end.getDate() + 1);
  const result = rows.filter(
    (row) =>
      (!search ||
        [row.id, row.name, row.email, row.phone, row.city, row.country].some(
          (value) => value.toLocaleLowerCase().includes(search),
        )) &&
      (filters.verification === "all" ||
        (filters.verification === "verified"
          ? row.verified === true
          : filters.verification === "unverified"
            ? row.verified === false
            : row.verified == null)) &&
      (!filters.country || row.country === filters.country) &&
      (!filters.city || row.city === filters.city) &&
      (!filters.onboarding || row.onboarding === filters.onboarding) &&
      (start == null || (row.createdAt != null && row.createdAt >= start)) &&
      (!end || (row.createdAt != null && row.createdAt < +end)) &&
      (filters.activity === "all" ||
        !orderCounts ||
        (filters.activity === "ordered"
          ? (orderCounts[row.id] || 0) > 0
          : !orderCounts[row.id])),
  );
  const sort = filters.sort;
  return result.sort((a, b) => {
    const field = ["az", "za"].includes(sort)
      ? "name"
      : sort.startsWith("coins")
        ? "coins"
        : "createdAt";
    const av = a[field],
      bv = b[field];
    if (av == null || av === "")
      return bv == null || bv === "" ? a.id.localeCompare(b.id) : 1;
    if (bv == null || bv === "") return -1;
    const direction = ["newest", "za", "coins-high"].includes(sort) ? -1 : 1;
    return (
      direction * (field === "name" ? collator.compare(av, bv) : av - bv) ||
      a.id.localeCompare(b.id)
    );
  });
}
export function ownerCounts(rows) {
  const counts = {};
  rows.forEach((row) => {
    const id = row.path.split("/")[1];
    counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}
export function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function customersCsv(rows) {
  const values = [
    [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "City",
      "Country",
      "Email verified",
      "Registered",
      "Cupid coins",
    ],
    ...rows.map((row) => [
      row.id,
      row.name,
      row.email,
      row.phone,
      row.city,
      row.country,
      row.verified == null ? "Not recorded" : row.verified ? "Yes" : "No",
      row.createdAt == null ? "" : new Date(row.createdAt).toISOString(),
      row.coins,
    ]),
  ];
  return (
    "\uFEFF" + values.map((row) => row.map(csvCell).join(",")).join("\r\n")
  );
}
