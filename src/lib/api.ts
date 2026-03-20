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

export async function getProfile(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch profile");
  return data;
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

export async function getMyBookings(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/appointments/my`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch bookings");
  return data;
}
