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

/** Step between offered start times (e.g. 09:00, 09:15, 09:30 …). */
export const SLOT_STEP_MINUTES = 15;

/** For “today”, a slot is bookable only if it starts after now plus this buffer. */
export const BOOKING_MIN_LEAD_MINUTES = 15;

/**
 * After the API returns `availableFrom` and `availableTo`, build slot start times every
 * {@link SLOT_STEP_MINUTES} inside that window (last start still fits before `availableTo`).
 */
export function slotsInOpeningWindow(availableFrom: string, availableTo: string): string[] {
  const start = parseHHMM(availableFrom);
  const end = parseHHMM(availableTo);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const slots: string[] = [];
  for (let t = start; t + SLOT_STEP_MINUTES <= end; t += SLOT_STEP_MINUTES) {
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
 * For the selected day, a slot is unavailable when it is “today” (local calendar) and the slot
 * start is not after `now` plus {@link BOOKING_MIN_LEAD_MINUTES} (past or too soon to book).
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
  const earliest = now.getTime() + BOOKING_MIN_LEAD_MINUTES * 60 * 1000;
  return slotAt.getTime() <= earliest;
}

/** Minutes since midnight → `HH:mm` (wraps within 24h). */
export function formatMinutesAsSlotTime(minsFromMidnight: number): string {
  const wrap = ((minsFromMidnight % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(wrap / 60);
  const m = wrap % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** End time `HH:mm` for a slot start plus duration in minutes. */
export function slotEndTimeHHmm(slotStartHHmm: string, durationMinutes: number): string {
  const start = parseHHMM(slotStartHHmm);
  if (!Number.isFinite(start) || durationMinutes <= 0) return "";
  return formatMinutesAsSlotTime(start + durationMinutes);
}
