"use client";

import { useEffect, useId, useMemo } from "react";
import { MOBILE_DIGITS_LEN, sanitizeMobileDigits } from "@/lib/mobileInput";
import { getCountryDialOptions, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";

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
  /** Border/focus theme for wrapper. */
  borderTone?: "amber" | "black";
  /** Restrict country select to one dial code (e.g. `+61`). */
  lockToDialCode?: string;
  /** When the select value is missing/invalid, fall back to this dial (default Australia +61). */
  defaultDialCode?: string;
  /** Custom class for the label. */
  labelClassName?: string;
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
  borderTone = "amber",
  lockToDialCode,
  defaultDialCode = "+61",
  labelClassName = "block text-sm font-medium text-charcoal mb-2",
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

  const wrapperToneClass =
    borderTone === "black"
      ? "border-black/80 focus-within:border-black hover:border-black"
      : "border-gray-200 focus-within:border-gray-400 hover:border-gray-300";
  const wrapperRingClass = borderTone === "black" ? "focus-within:ring-black/5" : "focus-within:ring-transparent";
  const allOptions = getCountryDialOptions();
  const filteredOptions = lockToDialCode
    ? allOptions.filter((o) => o.dial === lockToDialCode)
    : allOptions;
  const selectOptions = filteredOptions.length ? filteredOptions : allOptions;

  const resolvedCountrySelect = useMemo(() => {
    const exact = selectOptions.find((o) => o.value === countrySelect);
    if (exact) return exact.value;
    const dial = lockToDialCode ?? defaultDialCode;
    const au =
      dial === "+61"
        ? selectOptions.find((o) => o.value.startsWith("+61__AU__"))
        : undefined;
    const byDial = au ?? selectOptions.find((o) => o.dial === dial);
    return byDial?.value ?? getDefaultCountrySelectValue();
  }, [countrySelect, defaultDialCode, lockToDialCode, selectOptions]);

  useEffect(() => {
    if (lockToDialCode || resolvedCountrySelect === countrySelect) return;
    onCountryChange(resolvedCountrySelect);
  }, [countrySelect, lockToDialCode, onCountryChange, resolvedCountrySelect]);

  const forcedValue = lockToDialCode
    ? selectOptions.find((o) => o.value === resolvedCountrySelect)?.value ??
      selectOptions[0]?.value ??
      resolvedCountrySelect
    : resolvedCountrySelect;
  const isSelectLocked = Boolean(lockToDialCode);

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className={`flex ${r} border bg-white overflow-hidden shadow-sm transition-all ${wrapperToneClass} ${wrapperRingClass}`}>
        <div className="relative shrink-0 border-r border-gray-200 bg-gradient-to-b from-rose-50/80 to-rose-50/30">
          <select
            value={forcedValue}
            onChange={(e) => onCountryChange(e.target.value)}
            className={`w-[5.75rem] border-0 bg-transparent sm:w-[6.25rem] ${py} pl-3 pr-7 text-sm font-semibold tabular-nums text-charcoal focus:outline-none focus:ring-0 appearance-none bg-[length:12px] bg-[right_0.4rem_center] bg-no-repeat ${
              isSelectLocked ? "cursor-default" : "cursor-pointer"
            }`}
            style={{
              backgroundImage: isSelectLocked
                ? "none"
                : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            }}
            aria-label="Country code"
            disabled={isSelectLocked}
          >
            {selectOptions.map((c) => (
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
