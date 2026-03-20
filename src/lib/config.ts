/**
 * Central API base URL - used everywhere for backend requests.
 * Set NEXT_PUBLIC_API_URL in .env.local to override (e.g. for different environments).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://65.1.116.194:4002";
