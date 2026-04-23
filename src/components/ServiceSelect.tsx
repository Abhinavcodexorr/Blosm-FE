"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ServiceSelectOption = { id: string; title: string };

type Props = {
  id: string;
  label: string;
  value: string;
  options: ServiceSelectOption[];
  loading?: boolean;
  onChange: (serviceId: string) => void;
  required?: boolean;
};

export default function ServiceSelect({
  id,
  label,
  value,
  options,
  loading = false,
  onChange,
  required = true,
}: Props) {
  const hintId = useId();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function pick(idStr: string) {
    onChange(idStr);
    setOpen(false);
  }

  const placeholder = loading
    ? "Loading services…"
    : options.length === 0
      ? "No services available"
      : "Choose a service";

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <p id={hintId} className="sr-only">
        Opens a list of salon services. Choose one to continue booking.
      </p>
      <input type="hidden" value={value} required={required} readOnly tabIndex={-1} aria-hidden />

      <div ref={containerRef} className="relative">
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200/45 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/25 p-[2px] shadow-[0_4px_28px_-6px_rgba(26,26,26,0.1)] transition-[box-shadow,border-color] duration-300 focus-within:border-amber-300/70 focus-within:shadow-[0_8px_32px_-8px_rgba(201,162,39,0.22)]">
          <button
            id={id}
            type="button"
            disabled={loading}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-describedby={hintId}
            onClick={() => !loading && setOpen((o) => !o)}
            className="relative flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-[14px] bg-white/90 px-3 py-2.5 text-left backdrop-blur-[2px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/50 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-[3.5rem] sm:px-4"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100/90 to-rose-100/60 text-amber-800 shadow-inner ring-1 ring-amber-200/40"
              aria-hidden
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </span>
            <span
              className={`min-w-0 flex-1 text-base font-medium tracking-tight sm:text-[1.05rem] ${
                selected ? "text-charcoal" : "text-gray-500"
              }`}
            >
              {selected ? selected.title : placeholder}
            </span>
            <span
              className={`shrink-0 text-amber-800/70 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>

        {open && !loading && options.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-[min(18rem,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200/90 bg-white py-1 shadow-lg shadow-amber-900/5 ring-1 ring-black/[0.04]"
          >
            {options.map((opt) => {
              const isActive = opt.id === value;
              return (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => pick(opt.id)}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:text-[0.9375rem] ${
                      isActive
                        ? "bg-gradient-to-r from-amber-50 to-rose-50/80 text-amber-950"
                        : "text-charcoal hover:bg-amber-50/60"
                    }`}
                  >
                    <span
                      className={`flex h-2 w-2 shrink-0 rounded-full ${
                        isActive ? "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]" : "bg-gray-200"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">{opt.title}</span>
                    {isActive ? (
                      <svg
                        className="h-4 w-4 shrink-0 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {open && !loading && options.length === 0 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 rounded-xl border border-gray-200/90 bg-white px-4 py-6 text-center text-sm text-gray-500 shadow-lg ring-1 ring-black/[0.04]">
            No services to show. Please try again later.
          </div>
        ) : null}
      </div>
    </div>
  );
}
