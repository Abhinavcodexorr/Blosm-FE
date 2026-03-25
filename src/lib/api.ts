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

export async function verifyOtp(mobile: string, countryCode: string, otp: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, countryCode, otp }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || json.error?.message || "Invalid OTP");
  const { token, user } = json.data || {};
  return { token, user };
}

/** Matches backend `toPublicUser` (verify-otp + GET /users/me). */
export type PublicUser = {
  _id: string;
  mobile: string;
  countryCode: string;
  name: string | null;
  email: string | null;
  wallet: number;
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
  return {
    _id: String(o._id ?? ""),
    mobile: String(o.mobile ?? ""),
    countryCode: String(o.countryCode ?? ""),
    name: o.name == null || o.name === "" ? null : String(o.name),
    email: o.email == null || o.email === "" ? null : String(o.email),
    wallet,
  };
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
  time: string; // HH:mm, must be from available slots
  notes?: string;
};

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
