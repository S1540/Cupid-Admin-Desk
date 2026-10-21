export const number = (value) =>
  value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
export const compact = (value) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
export const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Date unavailable";
export const shortDate = (value) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(value),
  );
export const time = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
