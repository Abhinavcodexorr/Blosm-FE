import { API_BASE_URL, SHOW_SERVICE_PRICING } from "@/lib/config";

/** Priced line item under a subheading (booking menu). */
export type ApiBookingServiceItem = {
  name: string;
  price: number;
  _id?: string;
  /** Minutes (number) or a ready-made label (string), e.g. 15 or "15 mins" */
  duration?: number | string;
  /** Time / duration from API: number = minutes, string = label or digits e.g. `"15"` → `15 mins` */
  time?: string | number;
  /** Some backends use this key for minutes */
  durationMinutes?: number;
};

export type ApiBookingSubheading = {
  _id: string;
  subheading: string;
  items: ApiBookingServiceItem[];
};

export type ApiService = {
  _id: string;
  /** Legacy list page title */
  title?: string;
  /** Booking menu heading (may include emoji), e.g. "👁️ Eyelash Extensions" */
  heading?: string;
  description: string;
  image: string;
  alt?: string;
  items?: string[];
  /** Nested booking options when present */
  subheadings?: ApiBookingSubheading[];
  isActive?: boolean;
};

type ServicesApiResponse = {
  success: boolean;
  data: ApiService[];
};

async function fetchServices(): Promise<ApiService[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/services`, {
    credentials: "include",
  });
  const json: ServicesApiResponse = await res.json();
  if (!res.ok || !json.success) {
    throw new Error("Failed to fetch services");
  }
  return json.data || [];
}

function serviceDisplayTitle(s: ApiService): string {
  return (s.heading ?? s.title ?? "").trim() || "Service";
}

/**
 * Menu line labels for public services pages — item names from `subheadings`, never legacy `items` strings with prices.
 * If the same name appears more than once, duration is appended so variants stay distinct (e.g. two "Oil Massage" rows).
 */
function listingItemNamesFromService(s: ApiService): string[] {
  const subs = s.subheadings;
  if (!subs?.length) return [];

  const nameCounts = new Map<string, number>();
  for (const sub of subs) {
    for (const item of sub.items ?? []) {
      const name = item?.name?.trim();
      if (name) nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }
  }

  const out: string[] = [];
  for (const sub of subs) {
    for (const item of sub.items ?? []) {
      const name = item?.name?.trim();
      if (!name) continue;
      const dur = formatServiceItemDurationLabel(item);
      const label = (nameCounts.get(name) ?? 0) > 1 && dur ? `${name} (${dur})` : name;
      if (!out.includes(label)) out.push(label);
    }
  }
  return out;
}

export async function getServices(): Promise<
  { title: string; description: string; image: string; tag?: string | null; items?: string[] }[]
> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      title: serviceDisplayTitle(s),
      description: s.description,
      image: s.image || "",
      tag: null as string | null,
      items: listingItemNamesFromService(s),
    }));
}

export async function getCategories(): Promise<
  { _id: string; name: string; description: string; image: string; alt: string; items: string[] }[]
> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => ({
      _id: s._id,
      name: serviceDisplayTitle(s),
      description: s.description,
      image: s.image || "",
      alt: s.alt || serviceDisplayTitle(s),
      items: listingItemNamesFromService(s),
    }));
}

export async function getServiceTitles(): Promise<string[]> {
  const data = await fetchServices();
  const titles: string[] = [];
  for (const s of data) {
    if (s.isActive !== false) {
      titles.push(serviceDisplayTitle(s));
      for (const name of listingItemNamesFromService(s)) {
        titles.push(name);
      }
    }
  }
  return Array.from(new Set(titles));
}

/** One selectable row in the booking UI (checkbox). */
export type BookingServiceLine = {
  id: string;
  /** Sent as `serviceId` on the appointment API (item id when ObjectId-shaped, else parent service id). */
  bookingServiceId: string;
  /** API `subheadings[].subheading` (e.g. "Cut & finish"); legacy rows use category heading. */
  subheading: string;
  name: string;
  price: number;
  /** From API `time` / `duration` / `durationMinutes` — empty if not provided */
  durationLabel: string;
  /** Parsed minutes for summing total appointment length */
  durationMinutes: number;
};

/** Accordion group: API category with a display heading. */
export type BookingServiceCategory = {
  id: string;
  heading: string;
  lines: BookingServiceLine[];
};

function lineItemId(subheadingId: string, itemIndex: number, item: ApiBookingServiceItem): string {
  if (item._id && String(item._id).trim()) return String(item._id);
  return `${subheadingId}:${itemIndex}:${item.name}`;
}

/** 24-char hex, typical Mongo ObjectId (used for API `serviceId` when item has its own id). */
function isLikelyMongoObjectId(s: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(s.trim());
}

/**
 * Value for appointment `serviceId`: item id when it looks like ObjectId, otherwise parent service `_id`.
 */
function bookingServiceIdForLine(serviceId: string, item: ApiBookingServiceItem): string {
  const raw = item._id != null ? String(item._id).trim() : "";
  if (raw && isLikelyMongoObjectId(raw)) return raw;
  return serviceId;
}

/** If the API sends a bare number as text (e.g. "15"), show "15 mins". */
function normalizeMinutesDisplay(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d+$/.test(s)) return `${s} mins`;
  return s;
}

/** Builds a single display label for duration / time from common API shapes. */
export function formatServiceItemDurationLabel(item: ApiBookingServiceItem): string {
  if (item.time != null) {
    if (typeof item.time === "number" && Number.isFinite(item.time) && item.time > 0) {
      return `${item.time} mins`;
    }
    const timeStr = String(item.time).trim();
    if (timeStr) return normalizeMinutesDisplay(timeStr);
  }

  const mins = item.durationMinutes;
  if (typeof mins === "number" && Number.isFinite(mins) && mins > 0) {
    return `${mins} mins`;
  }

  const d = item.duration;
  if (typeof d === "number" && Number.isFinite(d) && d > 0) {
    return `${d} mins`;
  }
  if (typeof d === "string" && d.trim()) {
    return normalizeMinutesDisplay(d.trim());
  }

  return "";
}

/** First integer in a string (e.g. "15 mins" → 15, "60–90" → 60). */
function firstPositiveIntInString(s: string): number | null {
  const m = s.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Minutes for one service line (for summing booking length).
 * Uses `durationMinutes`, numeric `time` / `duration`, or digits in string fields.
 */
export function parseServiceItemDurationMinutes(item: ApiBookingServiceItem): number {
  if (
    item.durationMinutes != null &&
    typeof item.durationMinutes === "number" &&
    Number.isFinite(item.durationMinutes) &&
    item.durationMinutes > 0
  ) {
    return Math.round(item.durationMinutes);
  }
  if (item.time != null) {
    if (typeof item.time === "number" && Number.isFinite(item.time) && item.time > 0) {
      return Math.round(item.time);
    }
    const ts = String(item.time).trim();
    if (/^\d+$/.test(ts)) return parseInt(ts, 10);
    const n = firstPositiveIntInString(ts);
    if (n != null) return n;
  }
  if (item.duration != null) {
    if (typeof item.duration === "number" && Number.isFinite(item.duration) && item.duration > 0) {
      return Math.round(item.duration);
    }
    const ds = String(item.duration).trim();
    if (/^\d+$/.test(ds)) return parseInt(ds, 10);
    const n = firstPositiveIntInString(ds);
    if (n != null) return n;
  }
  return 0;
}

/** Duration · price for booking UI rows (skips empty parts). Price omitted when `SHOW_SERVICE_PRICING` is false. */
export function formatBookingLineMeta(durationLabel: string, priceFormatted: string): string {
  const dur = (durationLabel ?? "").trim();
  const price = SHOW_SERVICE_PRICING ? (priceFormatted ?? "").trim() : "";
  const parts = [dur || null, price || null].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : "—";
}

function categoryFromSubheadings(service: ApiService): BookingServiceCategory | null {
  const subs = service.subheadings;
  if (!subs?.length) return null;
  const heading = (service.heading ?? service.title ?? "").trim();
  if (!heading) return null;
  const lines: BookingServiceLine[] = [];
  for (const sub of subs) {
    const subId = sub._id;
    if (!subId || !Array.isArray(sub.items)) continue;
    const subLabel = (sub.subheading ?? "").trim() || heading;
    sub.items.forEach((item, idx) => {
      if (!item?.name?.trim()) return;
      lines.push({
        id: lineItemId(subId, idx, item),
        bookingServiceId: bookingServiceIdForLine(service._id, item),
        subheading: subLabel,
        name: item.name.trim(),
        price: typeof item.price === "number" && !Number.isNaN(item.price) ? item.price : 0,
        durationLabel: formatServiceItemDurationLabel(item),
        durationMinutes: parseServiceItemDurationMinutes(item),
      });
    });
  }
  if (!lines.length) return null;
  return { id: service._id, heading, lines };
}

/** Legacy: single “service” = whole category. */
function categoryLegacy(service: ApiService): BookingServiceCategory {
  const heading = (service.heading ?? service.title ?? "Service").trim();
  return {
    id: service._id,
    heading,
    lines: [
      {
        id: service._id,
        bookingServiceId: service._id,
        subheading: heading,
        name: heading,
        price: 0,
        durationLabel: "",
        durationMinutes: 0,
      },
    ],
  };
}

/**
 * Services for the appointment booking picker.
 * Prefers `heading` + `subheadings[].items` when the API returns that shape; otherwise one line per category.
 */
export async function getServicesForBooking(): Promise<BookingServiceCategory[]> {
  const data = await fetchServices();
  return data
    .filter((s) => s.isActive !== false)
    .map((s) => categoryFromSubheadings(s) ?? categoryLegacy(s));
}
