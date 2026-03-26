/** Parse "HH:mm" to minutes from midnight. */
export function parseHHMM(s: string): number {
  const parts = s.trim().split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const SLOT_MINUTES = 30;

/**
 * After the API returns `availableFrom` and `availableTo`, build 30-minute slot start times
 * only inside that window (first slot at `availableFrom`, last slot still fits before `availableTo`).
 */
export function halfHourSlotsInWindow(availableFrom: string, availableTo: string): string[] {
  const start = parseHHMM(availableFrom);
  const end = parseHHMM(availableTo);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const slots: string[] = [];
  for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
    slots.push(formatMinutes(t));
  }
  return slots;
}

function slotStartDate(dateYmd: string, slotHHmm: string): Date {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const [h, m] = slotHHmm.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

/** Local calendar `YYYY-MM-DD` (matches `<input type="date">`). */
export function localDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * For the selected day, a slot is unavailable (show disabled) when current time is at or past that slot start.
 * Only applies when the selected date is “today” in the user’s local calendar (same as `<input type="date">`).
 */
export function isSlotTimePassedForSelectedDate(
  selectedDateYmd: string,
  slotHHmm: string,
  now: Date = new Date()
): boolean {
  const day = selectedDateYmd.trim();
  const slot = slotHHmm.trim();
  const today = localDateYmd(now);
  if (day !== today) return false;
  const slotAt = slotStartDate(day, slot);
  if (Number.isNaN(slotAt.getTime())) return false;
  return slotAt.getTime() <= now.getTime();
}
