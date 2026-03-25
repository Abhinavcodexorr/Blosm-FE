"use client";

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
}: Props) {
  const r = rounded === "xl" ? "rounded-xl" : "rounded-lg";
  const py = rounded === "xl" ? "py-3.5" : "py-3";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal mb-2">
        {label}
      </label>
      <div
        className={`flex ${r} border border-gray-200 bg-white overflow-hidden shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500`}
      >
        <select
          value={countrySelect}
          onChange={(e) => onCountryChange(e.target.value)}
          className={`shrink-0 w-[5.25rem] sm:w-24 border-0 border-r border-gray-200 bg-rose-50/40 ${py} pl-2.5 pr-1 text-sm font-semibold tabular-nums text-charcoal focus:outline-none focus:ring-0 cursor-pointer`}
          aria-label="Country code"
        >
          {getCountryDialOptions().map((c) => (
            <option key={c.value} value={c.value} title={c.hint}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          maxLength={MOBILE_DIGITS_LEN}
          value={mobile}
          onChange={(e) => onMobileChange(sanitizeMobileDigits(e.target.value))}
          placeholder={placeholder}
          className={`min-w-0 flex-1 border-0 bg-transparent ${py} pl-3 pr-4 text-base text-charcoal focus:outline-none focus:ring-0 placeholder:text-gray-400`}
        />
      </div>
    </div>
  );
}
