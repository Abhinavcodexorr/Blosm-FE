"use client";

import { useId } from "react";
import { MOBILE_DIGITS_LEN, sanitizeMobileDigits } from "@/lib/mobileInput";
import { getCountryDialOptions } from "@/lib/countryDialCodes";

type Props = {
  id: string;
  label: string;
  mobile: string;
  countrySelect: string;
  onMobileChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  required?: boolean;
  /** `lg` matches appointment/contact forms; `xl` matches login modal */
  rounded?: "lg" | "xl";
  placeholder?: string;
  /** Optional line under the field. Omit for no helper row (unless digit meter is visible). */
  helperText?: string;
  /** Show digit count while typing (8–11 digits). */
  showDigitMeter?: boolean;
};

export default function PhoneCountryField({
  id,
  label,
  mobile,
  countrySelect,
  onMobileChange,
  onCountryChange,
  required = true,
  rounded = "lg",
  placeholder = "",
  helperText,
  showDigitMeter = false,
}: Props) {
  const hintId = useId();
  const meterId = useId();
  const r = rounded === "xl" ? "rounded-xl" : "rounded-lg";
  const py = rounded === "xl" ? "py-3.5" : "py-3";
  const digits = sanitizeMobileDigits(mobile);
  const len = digits.length;
  const showMeter = showDigitMeter && len > 0;
  const showFooter = Boolean(helperText) || showMeter;
  const describedBy = [helperText ? hintId : "", showMeter ? meterId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal mb-2">
        {label}
      </label>
      <div
        className={`flex ${r} border border-gray-200 bg-white overflow-hidden shadow-sm transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/35 hover:border-gray-300`}
      >
        <div className="relative shrink-0 border-r border-gray-200 bg-gradient-to-b from-rose-50/80 to-rose-50/30">
          <span className="pointer-events-none absolute left-2 top-1/2 z-[1] -translate-y-1/2 text-gray-400" aria-hidden>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </span>
          <select
            value={countrySelect}
            onChange={(e) => onCountryChange(e.target.value)}
            className={`w-[5.75rem] border-0 bg-transparent sm:w-[6.25rem] ${py} pl-8 pr-7 text-sm font-semibold tabular-nums text-charcoal focus:outline-none focus:ring-0 cursor-pointer appearance-none bg-[length:12px] bg-[right_0.4rem_center] bg-no-repeat`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            }}
            aria-label="Country code"
          >
            {getCountryDialOptions().map((c) => (
              <option key={c.value} value={c.value} title={c.hint}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required={required}
            maxLength={MOBILE_DIGITS_LEN}
            value={mobile}
            onChange={(e) => onMobileChange(sanitizeMobileDigits(e.target.value))}
            placeholder={placeholder || "8–11 digits"}
            aria-describedby={describedBy}
            className={`min-w-0 flex-1 border-0 bg-transparent ${py} pl-3 pr-4 text-base tracking-wide text-charcoal focus:outline-none focus:ring-0 placeholder:text-gray-400 placeholder:tracking-normal`}
          />
        </div>
      </div>
      {showFooter && (
        <div
          className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${
            helperText && showMeter ? "justify-between" : showMeter && !helperText ? "justify-end" : ""
          }`}
        >
          {helperText ? (
            <p id={hintId} className="max-w-[min(100%,28rem)] text-xs text-gray-500">
              {helperText}
            </p>
          ) : null}
          {showMeter && (
            <p
              id={meterId}
              className={`shrink-0 text-xs font-medium tabular-nums ${len >= 8 ? "text-emerald-700" : "text-amber-800/85"}`}
              aria-live="polite"
            >
              {len}/{MOBILE_DIGITS_LEN} digits{len < 8 ? " · min 8" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
