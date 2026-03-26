"use client";

import { useId, useMemo, useState, useEffect, useRef } from "react";

type Props = {
  id: string;
  label: string;
  value: string;
  min: string;
  max?: string;
  onChange: (value: string) => void;
  required?: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYmd(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

function formatLongDate(ymd: string): string {
  if (!ymd) return "";
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return "";
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRowDate(ymd: string): string {
  if (!ymd) return "";
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return "";
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function BookingDateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
  required = true,
}: Props) {
  const hintId = useId();
  const calendarId = useId();
  const longDate = value ? formatLongDate(value) : "";
  const rowDate = value ? formatRowDate(value) : "";

  const minDate = useMemo(() => parseYmd(min), [min]);
  const maxDate = useMemo(() => (max ? parseYmd(max) : null), [max]);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState(() => {
    const now = new Date();
    const todayYmd = toYmd(now);
    if (value) {
      const d = parseYmd(value);
      return { y: d.getFullYear(), m: d.getMonth() };
    }
    const inRange = todayYmd >= min && (!max || todayYmd <= max);
    const base = inRange ? now : parseYmd(min);
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const viewYear = view.y;
  const viewMonth = view.m;

  useEffect(() => {
    if (!value) return;
    const d = parseYmd(value);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const firstDow = first.getDay();
    const mondayFirst = (firstDow + 6) % 7;
    const total = daysInMonth(viewYear, viewMonth);
    const todayYmd = toYmd(new Date());
    const cells: {
      ymd: string | null;
      dayNum: number | null;
      disabled: boolean;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < mondayFirst; i++) {
      cells.push({ ymd: null, dayNum: null, disabled: false, isToday: false });
    }
    for (let d = 1; d <= total; d++) {
      const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      const disabled = ymd < min || (max != null && ymd > max);
      cells.push({
        ymd,
        dayNum: d,
        disabled,
        isToday: ymd === todayYmd,
      });
    }
    return cells;
  }, [viewYear, viewMonth, min, max]);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth]
  );

  const canPrev = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    return first > minDate;
  }, [viewYear, viewMonth, minDate]);

  const canNext = useMemo(() => {
    if (!maxDate) return true;
    const firstNextMonth = new Date(viewYear, viewMonth + 1, 1);
    return firstNextMonth <= maxDate;
  }, [viewYear, viewMonth, maxDate]);

  function goPrev() {
    if (!canPrev) return;
    setView((v) =>
      v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }
    );
  }

  function goNext() {
    if (!canNext) return;
    setView((v) =>
      v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }
    );
  }

  function pickDay(ymd: string) {
    onChange(ymd);
    setOpen(false);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <p id={hintId} className="sr-only">
        Choose a date using the calendar. Only dates within the allowed range can be selected.
      </p>
      <input type="hidden" value={value} required={required} readOnly tabIndex={-1} aria-hidden />

      <div ref={containerRef} className="relative">
        <div className="booking-date-shell group relative overflow-hidden rounded-2xl border border-amber-200/45 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/25 p-[2px] shadow-[0_4px_28px_-6px_rgba(26,26,26,0.1)] transition-[box-shadow,border-color] duration-300 focus-within:border-amber-300/70 focus-within:shadow-[0_8px_32px_-8px_rgba(201,162,39,0.22)]">
          <button
            id={id}
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={calendarId}
            aria-describedby={hintId}
            onClick={() => setOpen((o) => !o)}
            className="relative flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-[14px] bg-white/90 px-3 py-2.5 text-left backdrop-blur-[2px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500/50 sm:min-h-[3.5rem] sm:px-4"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            <span
              className={`min-w-0 flex-1 text-base font-medium tracking-tight sm:text-[1.05rem] ${
                value ? "text-charcoal" : "text-gray-500"
              }`}
            >
              {value ? rowDate : "Choose a date"}
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

        {open ? (
          <div
            id={calendarId}
            role="dialog"
            aria-label={`${label} calendar`}
            className="absolute left-0 top-[calc(100%+0.375rem)] z-50 w-[min(100%,220px)] rounded-lg border border-gray-200 bg-white p-2 shadow-md ring-1 ring-black/5"
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-charcoal transition-colors hover:bg-amber-50 hover:border-amber-300 disabled:pointer-events-none disabled:opacity-35"
                aria-label="Previous month"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold leading-tight text-charcoal">
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-charcoal transition-colors hover:bg-amber-50 hover:border-amber-300 disabled:pointer-events-none disabled:opacity-35"
                aria-label="Next month"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div role="grid" aria-label={`${label} days`} className="select-none">
              <div className="mb-1 grid grid-cols-7 gap-px">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[0.55rem] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {grid.map((cell, i) => {
                  if (cell.ymd == null || cell.dayNum == null) {
                    return <div key={`e-${i}`} className="h-7 w-7 min-w-[1.75rem]" />;
                  }
                  const selected = value === cell.ymd;
                  return (
                    <button
                      key={cell.ymd}
                      type="button"
                      role="gridcell"
                      disabled={cell.disabled}
                      onClick={() => !cell.disabled && cell.ymd && pickDay(cell.ymd)}
                      aria-selected={selected}
                      aria-label={
                        cell.disabled
                          ? `${cell.ymd}, not available`
                          : cell.isToday
                            ? `Today, ${cell.ymd}`
                            : cell.ymd
                      }
                      className={`flex h-7 w-7 min-w-[1.75rem] items-center justify-center rounded-[5px] text-[11px] font-medium leading-none transition-colors ${
                        cell.disabled
                          ? "cursor-not-allowed text-gray-300"
                          : selected
                            ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-600/20"
                            : cell.isToday
                              ? "border border-amber-400/70 bg-amber-50/80 text-amber-950 hover:bg-amber-100"
                              : "text-charcoal hover:bg-amber-50/90 hover:ring-1 hover:ring-amber-200"
                      }`}
                    >
                      {cell.dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {longDate ? (
        <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-amber-200/40 bg-gradient-to-r from-amber-50/80 to-rose-50/50 px-3.5 py-1.5 text-sm text-charcoal/90 shadow-sm ring-1 ring-amber-100/50">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
          <span className="font-medium">{longDate}</span>
        </p>
      ) : null}
    </div>
  );
}
