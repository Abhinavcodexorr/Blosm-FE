import { API_BASE_URL } from "@/lib/config";

export const AUTH_EXPIRED_EVENT = "blosm:auth-expired";

function emitAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

function getErrorMessageFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  if (typeof p.message === "string") return p.message;
  if (typeof p.error === "string") return p.error;
  if (p.error && typeof p.error === "object") {
    const nested = p.error as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  return "";
}

function maybeHandleAuthExpired(res: Response, payload: unknown): boolean {
  if (res.status === 401 || res.status === 403) {
    emitAuthExpired();
    return true;
  }
  const msg = getErrorMessageFromPayload(payload).toLowerCase();
  const mentionsAuth = /token|session|jwt|auth|login/.test(msg);
  const indicatesExpiry = /expired|invalid|unauthori|forbidden/.test(msg);
  if (mentionsAuth && indicatesExpiry) {
    emitAuthExpired();
    return true;
  }
  return false;
}

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

export type VerifyOtpResult = {
  token: string;
  user: PublicUser;
  isFirstLogin: boolean;
};

export type RedeemInviteCodeResult = {
  message?: string;
  creditedAmount?: number;
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

function parseBooleanField(raw: Record<string, unknown>, keys: string[]): boolean {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "boolean") return v;
  }
  return false;
}

function parseNumberField(raw: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

export async function verifyOtp(mobile: string, countryCode: string, otp: string): Promise<VerifyOtpResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, countryCode, otp }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || json.error?.message || "Invalid OTP");
  const data = json.data && typeof json.data === "object" ? (json.data as Record<string, unknown>) : {};
  const token = data.token;
  const rawUser = data.user;
  if (!token || rawUser == null || typeof rawUser !== "object") {
    throw new Error("Invalid response");
  }
  const isFirstLogin =
    parseBooleanField(data, ["isFirstLogin", "isNewUser", "isNew", "firstLogin"]) ||
    (rawUser && typeof rawUser === "object"
      ? parseBooleanField(rawUser as Record<string, unknown>, ["isFirstLogin", "isNewUser", "isNew", "firstLogin"])
      : false);
  return { token: String(token), user: parsePublicUser(rawUser), isFirstLogin };
}

export async function redeemInviteCode(token: string, inviteCode: string): Promise<RedeemInviteCodeResult> {
  const cleanedCode = inviteCode.replace(/\D/g, "");
  if (!cleanedCode) {
    throw new Error("Enter a valid invite code");
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/referrals/redeem`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inviteCode: cleanedCode }),
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json && typeof json === "object" && "success" in json && (json as { success?: boolean }).success === false)) {
    maybeHandleAuthExpired(res, json);
    const j = json as Record<string, unknown>;
    throw new Error(
      typeof j.message === "string"
        ? j.message
        : typeof j.error === "string"
          ? j.error
          : typeof j.error === "object" && j.error && typeof (j.error as { message?: unknown }).message === "string"
            ? String((j.error as { message?: unknown }).message)
            : "Failed to apply invite code"
    );
  }

  const data = json && typeof json === "object" && "data" in json && json.data && typeof json.data === "object"
    ? (json.data as Record<string, unknown>)
    : {};

  return {
    message:
      typeof data.message === "string"
        ? data.message
        : typeof (json as Record<string, unknown>).message === "string"
          ? String((json as Record<string, unknown>).message)
          : undefined,
    creditedAmount:
      parseNumberField(data, ["creditedAmount", "amount", "rewardAmount"]) ??
      parseNumberField(json as Record<string, unknown>, ["creditedAmount", "amount", "rewardAmount"]),
  };
}

export async function getProfile(token: string): Promise<PublicUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    maybeHandleAuthExpired(res, json);
    throw new Error(json.error || json.message || "Failed to fetch profile");
  }
  if (json.success === false) {
    maybeHandleAuthExpired(res, json);
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

/** One row inside `serviceSelections` (multi-service booking). */
export type AppointmentServiceSelection = {
  serviceId: string;
  subheading: string;
  serviceItemName: string;
};

/**
 * POST /appointments body — either one line (`serviceId` + `subheading` + `serviceItemName`)
 * or multiple (`serviceSelections`). Do not send both shapes at once.
 */
export type BookAppointmentBody = {
  name: string;
  email: string;
  mobile: string;
  countryCode?: string;
  date: string; // YYYY-MM-DD
  /** Optional; salon may confirm time later. */
  time?: string;
  notes?: string;
  /**
   * Parent salon **service** document id (API menu category / `services._id`).
   * Some backends require `service` or `serviceId` at the root; we send both when needed.
   */
  service?: string;
  /** Treatment / line id when distinct from parent `service`, else same as `service`. */
  serviceId?: string;
  subheading?: string;
  serviceItemName?: string;
  /** Multiple selections. */
  serviceSelections?: AppointmentServiceSelection[];
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
  const bookingErrMsg = (() => {
    if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
    const e = data?.error;
    if (typeof e === "string" && e.trim()) return e.trim();
    if (e && typeof e === "object" && typeof (e as { message?: unknown }).message === "string") {
      const m = (e as { message: string }).message.trim();
      if (m) return m;
    }
    return "Failed to book appointment";
  })();
  if (!res.ok) {
    maybeHandleAuthExpired(res, data);
    throw new Error(bookingErrMsg);
  }
  if (data && typeof data === "object" && data.success === false) {
    maybeHandleAuthExpired(res, data);
    throw new Error(bookingErrMsg);
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
  if (!res.ok) {
    maybeHandleAuthExpired(res, data);
    throw new Error(data.error || data.message || "Failed to fetch bookings");
  }
  if (data && typeof data === "object" && data.success === false) {
    maybeHandleAuthExpired(res, data);
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
