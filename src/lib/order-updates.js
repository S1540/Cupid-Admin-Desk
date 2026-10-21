// Only explicitly edited values are written; payment and delivery stay independent.
export function orderChanges(original, draft) {
  const changes = {};
  for (const key of ["status", "payment", "delivery"]) {
    const value = draft[key]?.trim() || "";
    if (value === original[key]) continue;
    if (!value || value.length > 80 || /[\x00-\x1f]/.test(value))
      throw new Error("Choose a status between 1 and 80 characters.");
    changes[key] = value;
  }
  return changes;
}
export function assertUnchanged(original, latest, changes) {
  for (const key of Object.keys(changes)) {
    if (original[key] !== latest[key])
      throw new Error(
        "This status was changed elsewhere. Close this form, refresh orders and try again.",
      );
  }
}
