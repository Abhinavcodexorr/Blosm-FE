"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { isSlotTimePassedForSelectedDate, parseHHMM, slotEndTimeHHmm, SLOT_STEP_MINUTES } from "@/lib/availabilitySlots";
import { formatTimeToAmPm } from "@/lib/timeDisplay";
import { formatBookingLineMeta } from "@/services/api";
import type { BookedSlot } from "@/lib/api";

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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatAud(price: number): string {
  if (price <= 0) return "";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatRowDate(ymd: string): string {
  if (!ymd) return "";
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return "";
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTotalTreatmentMinutes(m: number): string {
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} hr`;
  return `${h} hr ${r} min`;
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type BookingSummaryLine = {
  id: string;
  name: string;
  price: number;
  /** Category / service menu title from API */
  heading: string;
  /** API `subheadings[].subheading` when present (e.g. "Cut & finish") */
  subheading?: string;
  durationLabel: string;
};

type Props = {
  onBack: () => void;
  onContinue: () => void;
  date: string;
  onDateChange: (ymd: string) => void;
  time: string;
  onTimeChange: (slot: string) => void;
  minYmd: string;
  maxYmd: string;
  baseSlots: string[];
  availabilityLoading: boolean;
  availabilityError: string;
  clockTick: number;
  summaryLines: BookingSummaryLine[];
  /** Sum of selected services’ durations (minutes); drives “ends at” on each slot. */
  totalSelectedDurationMinutes?: number;
  /** Shown when Continue is pressed without date/time */
  stepError?: string;
  /** Existing bookings used to disable overlapping times for selected date. */
  bookedSlots?: BookedSlot[];
};

export default function BookingDayTimeStep({
  onBack,
  onContinue,
  date,
  onDateChange,
  time,
  onTimeChange,
  minYmd,
  maxYmd,
  baseSlots,
  availabilityLoading,
  availabilityError,
  clockTick,
  summaryLines,
  totalSelectedDurationMinutes = 0,
  stepError,
  bookedSlots = [],
}: Props) {
  const minDate = useMemo(() => parseYmd(minYmd), [minYmd]);
  const maxDate = useMemo(() => parseYmd(maxYmd), [maxYmd]);

  const [view, setView] = useState(() => {
    const now = new Date();
    const todayYmd = toYmd(now);
    if (date) {
      const d = parseYmd(date);
      return { y: d.getFullYear(), m: d.getMonth() };
    }
    const inRange = todayYmd >= minYmd && todayYmd <= maxYmd;
    const base = inRange ? now : parseYmd(minYmd);
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  useEffect(() => {
    if (!date) return;
    const d = parseYmd(date);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }, [date]);

  const viewYear = view.y;
  const viewMonth = view.m;

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
      const disabled = ymd < minYmd || ymd > maxYmd;
      cells.push({
        ymd,
        dayNum: d,
        disabled,
        isToday: ymd === todayYmd,
      });
    }
    return cells;
  }, [viewYear, viewMonth, minYmd, maxYmd]);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString("en-AU", {
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
    const firstNextMonth = new Date(viewYear, viewMonth + 1, 1);
    return firstNextMonth <= maxDate;
  }, [viewYear, viewMonth, maxDate]);

  /** Hide past / too-soon slots for today (see `isSlotTimePassedForSelectedDate`). */
  const bookableSlots = useMemo(() => {
    if (!date) return baseSlots;
    void clockTick;
    const now = new Date();
    return baseSlots.filter((slot) => !isSlotTimePassedForSelectedDate(date, slot, now));
  }, [baseSlots, date, clockTick]);

  const bookedRangesForDate = useMemo(() => {
    if (!date) return [];
    return bookedSlots
      .filter((row) => row.date === date)
      .map((row) => ({ start: parseHHMM(row.start), end: parseHHMM(row.end) }))
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start);
  }, [bookedSlots, date]);

  function isOverlappingBookedRange(slot: string): boolean {
    if (!date || bookedRangesForDate.length === 0) return false;
    const slotStart = parseHHMM(slot);
    if (!Number.isFinite(slotStart)) return false;
    const duration = totalSelectedDurationMinutes > 0 ? totalSelectedDurationMinutes : SLOT_STEP_MINUTES;
    const slotEnd = slotStart + duration;
    return bookedRangesForDate.some((r) => slotStart < r.end && slotEnd > r.start);
  }

  const visibleSlots = useMemo(
    () => bookableSlots.filter((slot) => !isOverlappingBookedRange(slot)),
    [bookableSlots, bookedRangesForDate, totalSelectedDurationMinutes, date]
  );

  useEffect(() => {
    if (!date || !time) return;
    const now = new Date();
    const nowInvalid = isSlotTimePassedForSelectedDate(date, time, now);
    const bookedInvalid = isOverlappingBookedRange(time);
    if (nowInvalid || bookedInvalid) onTimeChange("");
  }, [date, time, clockTick, bookedRangesForDate, totalSelectedDurationMinutes, onTimeChange]);

  return (
    <section className="relative mx-auto flex w-full max-w-[81rem] flex-col lg:h-full lg:min-h-0">
      <div
        className="pointer-events-none absolute -left-24 -top-8 h-72 w-72 rounded-full bg-gradient-to-br from-amber-200/35 via-amber-100/20 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-48 h-64 w-64 rounded-full bg-gradient-to-bl from-amber-200/30 via-amber-50/15 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col lg:min-h-0 lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="relative flex min-h-[2.75rem] items-center justify-center pb-2 lg:pb-2">
          <button
            type="button"
            onClick={onBack}
            className="absolute -left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal shadow-sm transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.97] sm:-left-36"
            aria-label="Back to services"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">
              Day &amp; time
            </h1>
          </div>
        </div>

        <div className="lg:min-h-0 lg:overflow-hidden">
          {/* Equal-height single row: calendar | time | booking */}
          <div className="grid min-h-0 gap-5 lg:grid-cols-[340px_minmax(0,700px)_340px] lg:items-stretch lg:justify-center lg:gap-6">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white via-white to-amber-50/25 shadow-[0_16px_42px_-24px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03]">
              <div className="min-h-0 flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch] sm:p-5">
                <section className="rounded-2xl border border-gray-100/90 bg-gray-50/50 p-3 shadow-inner shadow-white/60 ring-1 ring-black/[0.02]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => canPrev && setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
                  disabled={!canPrev}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/80 bg-white text-charcoal shadow-sm transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Previous month"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="min-w-0 flex-1 text-center font-display text-base font-semibold tracking-tight text-charcoal sm:text-lg">
                  {monthLabel}
                </p>
                <button
                  type="button"
                  onClick={() => canNext && setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
                  disabled={!canNext}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/80 bg-white text-charcoal shadow-sm transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Next month"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

                  <div role="grid" aria-label="Choose day" className="mx-auto w-full max-w-[17.5rem] select-none sm:max-w-[19rem]">
                    <div className="mb-2 grid grid-cols-7 gap-1">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d}
                      className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400"
                    >
                      {d}
                    </div>
                  ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                  {grid.map((cell, i) => {
                    if (cell.ymd == null || cell.dayNum == null) {
                      return <div key={`e-${i}`} className="aspect-square min-h-[2.45rem]" />;
                    }
                    const selected = date === cell.ymd;
                    return (
                      <button
                        key={cell.ymd}
                        type="button"
                        role="gridcell"
                        disabled={cell.disabled}
                        onClick={() => {
                          if (!cell.disabled && cell.ymd) {
                            onDateChange(cell.ymd);
                            onTimeChange("");
                          }
                        }}
                        aria-selected={selected}
                        className={`mx-auto flex aspect-square min-h-[2.45rem] w-full max-w-[2.6rem] items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-200 ${
                          cell.disabled
                            ? "cursor-not-allowed text-gray-300"
                            : selected
                              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/35 ring-2 ring-amber-400/40"
                              : cell.isToday
                                ? "border-2 border-amber-400/90 bg-white text-amber-700 shadow-sm hover:scale-105 hover:border-amber-500 hover:bg-amber-50"
                                : "text-charcoal hover:scale-105 hover:bg-white hover:shadow-md"
                        }`}
                      >
                        {cell.dayNum}
                      </button>
                    );
                  })}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white via-white to-amber-50/20 shadow-[0_14px_36px_-22px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03] lg:h-[70vh] lg:max-h-[70vh]">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
              {date ? (
                <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/90">Time</p>
                    <h2 className="mt-0.5 font-display text-lg font-semibold text-charcoal sm:text-xl">
                      {formatRowDate(date)}
                    </h2>
                  </div>
                </div>
              ) : (
                <h2 className="mb-5 font-display text-lg font-semibold text-charcoal sm:text-xl">Choose your day</h2>
              )}

              <div className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
                {!date ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-gray-600">Select a date in the calendar first.</p>
                    <p className="mt-1 text-xs text-gray-400">We&apos;ll load open times for that day.</p>
                  </div>
                ) : availabilityLoading ? (
                  <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      </span>
                      Loading times…
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-14 animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]"
                          style={{ animationDuration: "1.2s" }}
                        />
                      ))}
                    </div>
                  </div>
                ) : availabilityError ? (
                  <p className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-50/30 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
                    {availabilityError}
                  </p>
                ) : baseSlots.length === 0 ? (
                  <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white px-5 py-8 text-center shadow-inner">
                    <p className="text-sm font-medium text-gray-700">No times that suit?</p>
                    <p className="mt-1 text-xs text-gray-500">Tell us what works — we&apos;ll follow up.</p>
                    <Link
                      href="/contact"
                      className="mt-5 inline-flex rounded-full border border-amber-500 bg-white px-5 py-2.5 text-sm font-semibold text-amber-600 shadow-md shadow-amber-500/10 transition-all hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-500/25"
                    >
                      Join our waitlist
                    </Link>
                  </div>
                ) : visibleSlots.length === 0 ? (
                  <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-5 text-sm leading-relaxed text-gray-600">
                    No start times left today that are far enough in advance. Pick another date or check back
                    tomorrow.
                  </div>
                ) : (
                  <div className="min-h-0 flex-1" role="listbox" aria-label="Time slots">
                    <div className="grid grid-cols-4 gap-2.5">
                      {visibleSlots.map((slot) => {
                      void clockTick;
                      const now = new Date();
                      const passed = date ? isSlotTimePassedForSelectedDate(date, slot, now) : false;
                      const disabled = passed;
                      const selected = time === slot && !disabled;
                      const endAt =
                        !disabled && totalSelectedDurationMinutes > 0
                          ? slotEndTimeHHmm(slot, totalSelectedDurationMinutes)
                          : "";
                      const slotTitle = passed
                        ? "This time has already passed"
                        : endAt
                          ? `${formatTimeToAmPm(slot)} start — ends ${formatTimeToAmPm(endAt)}`
                          : undefined;
                      return (
                        <button
                          key={slot}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={disabled}
                          title={slotTitle}
                          onClick={() => {
                            if (!disabled) onTimeChange(slot);
                          }}
                          className={`group flex min-h-[3.35rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-2 text-center text-sm font-semibold tabular-nums transition-all duration-200 active:scale-[0.97] ${
                            disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60"
                              : selected
                                ? "border-amber-500 bg-gradient-to-b from-amber-50 to-amber-100/80 text-amber-950 shadow-md shadow-amber-500/15 ring-2 ring-amber-400/30"
                                : "border-gray-200/90 bg-white text-charcoal shadow-sm hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md"
                          }`}
                        >
                          <span className="tabular-nums tracking-tight">{formatTimeToAmPm(slot)}</span>
                          {endAt ? (
                            <span className="text-[10px] font-medium leading-tight text-gray-500 group-hover:text-amber-700/80 sm:text-[11px]">
                              ends {formatTimeToAmPm(endAt)}
                            </span>
                          ) : null}
                        </button>
                      );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {stepError ? (
                <p className="mt-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
                  {stepError}
                </p>
              ) : null}
              </div>
            </div>

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-gradient-to-b from-gray-50 to-white shadow-[0_16px_40px_-20px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04] lg:h-[70vh] lg:max-h-[70vh]">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pr-3 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] sm:p-5 sm:pr-4">
                <div className="text-charcoal">
                  <div className="min-w-0 flex-1 text-sm">
                    {summaryLines.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-4 text-center text-xs text-gray-500">
                        No services in summary yet.
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {summaryLines.map((row) => (
                          <li
                            key={row.id}
                            className="rounded-xl border border-gray-100/90 bg-white/90 p-3 shadow-sm transition-shadow hover:shadow-md"
                          >
                            {row.heading ? (
                              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600/90 line-clamp-2">
                                {row.heading}
                              </p>
                            ) : null}
                            {row.subheading && row.subheading !== row.heading ? (
                              <p className="mt-0.5 text-[11px] font-semibold leading-snug text-charcoal/85 line-clamp-2">
                                {row.subheading}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm font-semibold text-charcoal">{row.name}</p>
                            <p className="mt-1.5 text-xs leading-snug text-gray-600">
                              {formatBookingLineMeta(row.durationLabel, formatAud(row.price))}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {totalSelectedDurationMinutes > 0 ? (
                      <p className="mt-4 flex items-center justify-between rounded-lg border border-amber-100/80 bg-amber-50/50 px-3 py-2 text-xs font-medium text-amber-900">
                        <span className="text-amber-700/90">Combined duration</span>
                        <span className="tabular-nums">{formatTotalTreatmentMinutes(totalSelectedDurationMinutes)}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                {time ? (
                  <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-3 py-2.5 text-xs text-gray-600">
                    <span className="font-semibold text-charcoal">Time </span>
                    <span className="font-mono text-[13px] text-gray-800">{formatTimeToAmPm(time)}</span>
                    {totalSelectedDurationMinutes > 0 ? (
                      <>
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span className="text-gray-500">ends</span>{" "}
                        <span className="font-mono text-[13px] text-gray-800">
                          {formatTimeToAmPm(slotEndTimeHHmm(time, totalSelectedDurationMinutes) || "—")}
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>

        <div className="pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:shrink-0">
          <button
            type="button"
            onClick={onContinue}
            className="relative w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 py-3.5 text-[15px] font-bold tracking-wide text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:via-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/35 active:scale-[0.99] sm:py-4 sm:text-base"
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}
