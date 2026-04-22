import { API_BASE_URL } from "@/lib/config";

export async function sendOtp(mobile: string, countryCode: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, countryCode }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to send OTP");
  return data;
}

/** Single wallet ledger row from `GET /users/me` and verify-otp user payload. */
export type WalletHistoryEntry = {
  _id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string | null;
  appointmentId: string | null;
  /** Set when the entry is linked to a booking. */
  appointmentName: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  createdAt: string;
};

function strOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

function parseWalletHistoryEntry(raw: unknown): WalletHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v !== "" ? Number(v) || 0 : 0;
  return {
    _id: String(e._id ?? ""),
    type: String(e.type ?? "unknown"),
    amount: num(e.amount),
    balanceBefore: num(e.balanceBefore),
    balanceAfter: num(e.balanceAfter),
    note: e.note == null || e.note === "" ? null : String(e.note),
    appointmentId:
      e.appointmentId == null || e.appointmentId === "" ? null : String(e.appointmentId),
    appointmentName: strOrNull(e.appointmentName),
    appointmentDate: strOrNull(e.appointmentDate),
    appointmentTime: strOrNull(e.appointmentTime),
    createdAt: e.createdAt != null ? String(e.createdAt) : "",
  };
}

function parseWalletHistory(raw: unknown): WalletHistoryEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map(parseWalletHistoryEntry).filter((x): x is WalletHistoryEntry => x != null);
}

/** Matches backend `toPublicUser` (verify-otp + GET /users/me). */
export type PublicUser = {
  _id: string;
  mobile: string;
  countryCode: string;
  name: string | null;
  email: string | null;
  wallet: number;
  walletHistory?: WalletHistoryEntry[];
};

function parsePublicUser(raw: unknown): PublicUser {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid profile response");
  }
  const o = raw as Record<string, unknown>;
  const walletRaw = o.wallet;
  const wallet =
    typeof walletRaw === "number" && Number.isFinite(walletRaw)
      ? walletRaw
      : typeof walletRaw === "string" && walletRaw !== ""
        ? Number(walletRaw) || 0
        : 0;
  const wh = parseWalletHistory(o.walletHistory);
  return {
    _id: String(o._id ?? ""),
    mobile: String(o.mobile ?? ""),
    countryCode: String(o.countryCode ?? ""),
    name: o.name == null || o.name === "" ? null : String(o.name),
    email: o.email == null || o.email === "" ? null : String(o.email),
    wallet,
    ...(wh ? { walletHistory: wh } : {}),
  };
}

export async function verifyOtp(mobile: string, countryCode: string, otp: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, countryCode, otp }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || json.error?.message || "Invalid OTP");
  const { token, user: rawUser } = json.data || {};
  if (!token || rawUser == null || typeof rawUser !== "object") {
    throw new Error("Invalid response");
  }
  return { token, user: parsePublicUser(rawUser) };
}

export async function getProfile(token: string): Promise<PublicUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || json.message || "Failed to fetch profile");
  }
  if (json.success === false) {
    throw new Error(json.message || json.error?.message || "Failed to fetch profile");
  }
  const payload = json.data !== undefined ? json.data : json;
  let userPayload: unknown = payload;
  if (payload && typeof payload === "object" && "user" in payload && (payload as { user: unknown }).user != null) {
    userPayload = (payload as { user: unknown }).user;
  } else if (json.user != null && payload === json) {
    userPayload = json.user;
  }
  return parsePublicUser(userPayload);
}

export type BookAppointmentBody = {
  name: string;
  email: string;
  mobile: string;
  countryCode?: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  /** Optional; salon may confirm time later. */
  time?: string;
  notes?: string;
};

export type SalonAvailability = {
  availableFrom: string;
  availableTo: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getSalonAvailability(): Promise<SalonAvailability> {
  const res = await fetch(`${API_BASE_URL}/api/v1/availability`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error?.message || "Failed to fetch availability");
  }
  const data = json.data as SalonAvailability | undefined;
  if (!data?.availableFrom || !data?.availableTo) {
    throw new Error("Invalid availability response");
  }
  return data;
}

export type AvailableSlotsResponse = {
  slots: string[];
  duration: number;
  serviceTitle: string;
};

export async function getAvailableSlots(date: string, serviceId: string): Promise<AvailableSlotsResponse> {
  const params = new URLSearchParams({ date, serviceId });
  const res = await fetch(`${API_BASE_URL}/api/v1/appointments/available-slots?${params}`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || json.error?.message || "Failed to fetch available slots");
  }
  return json.data || { slots: [], duration: 30, serviceTitle: "" };
}

/** Public contact / enquiry — no auth. `mobile` must be digits only. */
export type EnquiryBody = {
  name: string;
  email: string;
  mobile: string;
  countryCode: string;
  message: string;
};

export async function submitEnquiry(body: EnquiryBody) {
  const res = await fetch(`${API_BASE_URL}/api/v1/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : "Failed to send message"
    );
  }
  if (data && typeof data === "object" && data.success === false) {
    throw new Error(
      typeof data.message === "string" ? data.message : "Failed to send message"
    );
  }
  return data;
}

export async function bookAppointment(body: BookAppointmentBody, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/v1/appointments`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to book appointment");
  if (data && typeof data === "object" && data.success === false) {
    throw new Error(data.message || data.error?.message || "Failed to book appointment");
  }
  return data;
}

/** One row from GET /appointments/my — matches typical backend payload. */
export type MyAppointment = {
  _id?: string;
  userId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  service?: string;
  serviceId?: string;
  duration?: number;
  date?: string;
  time?: string;
  status?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  price?: number | string;
};

/**
 * Normalizes API envelopes, e.g.
 * `{ success: true, data: [...] }` or `{ appointments: [...] }` or a bare array.
 */
export function parseMyBookingsList(json: unknown): MyAppointment[] {
  if (json == null) return [];
  if (Array.isArray(json)) return json as MyAppointment[];
  if (typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const inner = o.data ?? o.appointments ?? o.results;
  if (Array.isArray(inner)) return inner as MyAppointment[];
  return [];
}

/** Raw JSON from GET /appointments/my (legacy). */
export async function getMyBookings(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/appointments/my`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch bookings");
  if (data && typeof data === "object" && data.success === false) {
    throw new Error(
      typeof data.message === "string" ? data.message : "Failed to fetch bookings"
    );
  }
  return data;
}

export async function getMyBookingsList(token: string): Promise<MyAppointment[]> {
  const json = await getMyBookings(token);
  return parseMyBookingsList(json);
}
