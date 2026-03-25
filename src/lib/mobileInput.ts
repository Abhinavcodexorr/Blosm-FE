/** National mobile: digits only; max length enforced in inputs. */
export const MOBILE_DIGITS_LEN = 11;
export const MOBILE_DIGITS_MIN = 8;

export function sanitizeMobileDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MOBILE_DIGITS_LEN);
}

export function isValidMobileDigits(value: string): boolean {
  const d = sanitizeMobileDigits(value);
  return d.length >= MOBILE_DIGITS_MIN && d.length <= MOBILE_DIGITS_LEN;
}
