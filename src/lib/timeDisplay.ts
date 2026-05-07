export function formatTimeToAmPm(value: string): string {
  const raw = (value ?? "").trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return raw;
  }
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, "0")} ${period}`;
}
