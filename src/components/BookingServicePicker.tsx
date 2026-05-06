"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBookingLineMeta, type BookingServiceCategory } from "@/services/api";
import { SALON_BOOKING_ADDRESS, SALON_BOOKING_NAME } from "@/lib/salonVenue";

function formatAud(price: number): string {
  if (price <= 0) return "";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(price);
}

type Props = {
  categories: BookingServiceCategory[];
  selectedIds: string[];
  onToggle: (lineId: string) => void;
  loading: boolean;
};

export default function BookingServicePicker({
  categories,
  selectedIds,
  onToggle,
  loading,
}: Props) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const c of categories) {
        if (next[c.id] === undefined) next[c.id] = false;
      }
      return next;
    });
  }, [categories]);

  const selectedLines = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; price: number; heading: string; durationLabel: string }
    >();
    for (const cat of categories) {
      for (const line of cat.lines) {
        if (selectedSet.has(line.id)) {
          byId.set(line.id, {
            id: line.id,
            name: line.name,
            price: line.price,
            heading: cat.heading,
            durationLabel: (line.durationLabel ?? "").trim(),
          });
        }
      }
    }
    return selectedIds.map((id) => byId.get(id)).filter((row): row is NonNullable<typeof row> => row != null);
  }, [categories, selectedSet, selectedIds]);

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm">
        Loading services…
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-10 text-center text-sm text-gray-600 shadow-sm">
        No services available right now. Please try again later.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col sm:max-w-2xl lg:max-w-3xl">
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-h-0 overflow-y-auto overscroll-y-contain p-2.5 [-webkit-overflow-scrolling:touch] sm:p-3">
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const count = cat.lines.filter((l) => selectedSet.has(l.id)).length;
                const isOpen = expanded[cat.id] === true;
                const panelId = `booking-cat-panel-${cat.id}`;
                const headingId = `booking-cat-heading-${cat.id}`;
                return (
                  <section
                    key={cat.id}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/40 shadow-sm ring-1 ring-black/[0.02]"
                  >
                    <button
                      type="button"
                      id={headingId}
                      onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !isOpen }))}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/90 sm:px-4 sm:py-3.5"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className="min-w-0 text-[0.9375rem] font-semibold leading-snug text-amber-600 sm:text-base">
                        {cat.heading}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {count > 0 ? (
                          <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-amber-500 px-2 text-xs font-bold text-white tabular-nums shadow-sm">
                            {count}
                          </span>
                        ) : null}
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80">
                          <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </span>
                    </button>
                    {isOpen ? (
                      <ul
                        id={panelId}
                        role="region"
                        aria-labelledby={headingId}
                        className="space-y-0 border-t border-gray-100/90 bg-white px-2 py-1 sm:px-3"
                      >
                        {cat.lines.map((line) => {
                          const checked = selectedSet.has(line.id);
                          const priceStr = formatAud(line.price);
                          const meta = formatBookingLineMeta(line.durationLabel, priceStr);
                          return (
                            <li key={line.id} className="border-b border-gray-50 last:border-0">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                onClick={() => onToggle(line.id)}
                                className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-1 pr-2 text-left transition-colors hover:bg-amber-50/40 active:bg-amber-50/60 sm:min-h-[3rem] sm:py-3"
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                                  <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                                      checked
                                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                                        : "border-gray-300 bg-white hover:border-amber-300"
                                    }`}
                                    aria-hidden
                                  >
                                    {checked ? (
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2.5}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    ) : null}
                                  </span>
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold leading-snug text-charcoal sm:text-[0.9375rem]">
                                    {line.name}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-snug text-gray-500 sm:text-sm">
                                    {meta}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="flex min-h-0 flex-col border-t border-gray-100 bg-gray-50/55 p-3.5 md:border-l md:border-t-0">
            <p className="text-[13px] leading-relaxed text-gray-700">
              Choose the service you&apos;d like to book. Browse available options and pick what suits you best.
            </p>

            <div className="mt-3.5 rounded-xl border border-gray-200/90 bg-white px-3 py-3 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-amber-500" aria-hidden>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{SALON_BOOKING_NAME}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{SALON_BOOKING_ADDRESS}</p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 min-h-0 flex-1 rounded-xl border border-amber-100/50 bg-white/90 p-3 shadow-inner">
              {selectedLines.length === 0 ? (
                <p className="text-sm text-gray-500">No services selected yet.</p>
              ) : (
                <ul className="max-h-full space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                  {selectedLines.map((row) => (
                    <li key={row.id} className="rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2">
                      <p className="text-[11px] font-semibold leading-snug text-amber-600/90 line-clamp-1">
                        {row.heading}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal line-clamp-1">{row.name}</p>
                      {row.durationLabel ? (
                        <p className="mt-1 text-xs leading-snug text-gray-600 line-clamp-1">{row.durationLabel}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
