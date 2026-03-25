/** Format API `price` (number or numeric string) as AUD, or null if missing/invalid. */
export function formatAud(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
