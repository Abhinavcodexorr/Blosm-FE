"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBookingLineMeta, type BookingServiceCategory } from "@/services/api";

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
    <div className="flex w-full flex-col">
      <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(0,0,0,0.1)] md:h-full md:min-h-0 md:flex-1 md:overflow-hidden">
        <div className="p-2.5 sm:p-3 md:min-h-0 md:flex-1">
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
      </div>
    </div>
  );
}
