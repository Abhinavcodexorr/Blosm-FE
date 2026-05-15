"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";
import { getMyBookingsList, type MyAppointment } from "@/lib/api";
import { formatAud } from "@/lib/formatCurrency";
import { formatTimeToAmPm } from "@/lib/timeDisplay";

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupedServiceSelections(
  apt: MyAppointment
): Array<{ heading: string; items: Array<{ name: string; meta: string }> }> {
  const raw = apt as unknown as Record<string, unknown>;
  const out = new Map<string, Array<{ name: string; meta: string }>>();
  const rows = raw.serviceSelections;
  if (!Array.isArray(rows)) return [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const heading = String(r.serviceName ?? r.subheading ?? "Service").trim() || "Service";
    const itemName = String(r.serviceItemName ?? r.name ?? "").trim();
    if (!itemName) continue;
    const durationLabel = String(r.durationLabel ?? "").trim();
    const parsedPrice =
      typeof r.price === "number"
        ? r.price
        : typeof r.price === "string"
          ? Number(r.price)
          : Number.NaN;
    const priceLabel = Number.isFinite(parsedPrice) && parsedPrice > 0 ? formatAud(parsedPrice) : "";
    const meta = [durationLabel, priceLabel].filter(Boolean).join(" · ");

    const list = out.get(heading) ?? [];
    if (!list.some((entry) => entry.name === itemName)) {
      list.push({ name: itemName, meta });
    }
    out.set(heading, list);
  }
  return Array.from(out.entries()).map(([heading, items]) => ({ heading, items }));
}

export default function AppointmentsPage() {
  const { token, openLogin } = useLoginModal();
  const [list, setList] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getMyBookingsList(token)
      .then((rows) => {
        if (!cancelled) setList(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load appointments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-b from-rose-50/30 via-white to-amber-50/20">
        <div className="max-w-3xl mx-auto px-6">
          {!token ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <h1 className="font-display text-3xl font-light text-[#8B6914] mb-3">My appointments</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Sign in to see your appointments.
              </p>
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-amber-700"
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-light text-[#8B6914]">My appointments</h1>
              </div>

              {loading ? (
                <p className="text-center text-gray-500 py-12 text-sm">Loading your appointments…</p>
              ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4 text-sm text-red-800">{error}</div>
              ) : list.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <p className="text-gray-600 mb-6">You don&apos;t have any appointments yet.</p>
                  <Link
                    href="/services"
                    className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
                  >
                    Browse services
                  </Link>
                </div>
              ) : (
                <ul className="space-y-5">
                  {list.map((apt) => {
                    const grouped = groupedServiceSelections(apt);
                    return (
                    <li
                      key={apt._id || `${apt.date}-${apt.time}-${apt.serviceId}`}
                      className="overflow-hidden rounded-2xl border border-amber-100/70 bg-gradient-to-b from-white via-white to-amber-50/20 shadow-[0_14px_38px_-24px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.02]"
                    >
                      <div className="border-b border-amber-100/60 px-5 py-4 md:px-6 md:py-5">
                        <div>
                          <p className="text-sm font-medium text-charcoal/80">
                            {formatDate(apt.date)}
                            {apt.time ? ` · ${formatTimeToAmPm(apt.time)}` : ""}
                            {typeof apt.duration === "number" ? ` · ${apt.duration} mins` : ""}
                          </p>
                          {formatAud(apt.price) ? (
                            <p className="mt-2 text-sm font-semibold tabular-nums text-[#8B6914]">
                              {formatAud(apt.price)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3 bg-white/70 px-5 py-4 text-xs text-gray-600 md:px-6">
                        {grouped.length > 0 ? (
                          <div className="rounded-xl border border-amber-100/70 bg-amber-50/40 p-3">
                            <p className="text-sm font-bold uppercase tracking-wide text-black">Selected Services</p>
                            <div className="mt-2 space-y-2.5">
                              {grouped.map((group) => (
                                <div key={group.heading}>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">{group.heading}</p>
                                  <ul className="mt-1 list-disc pl-5 space-y-1">
                                    {group.items.map((item) => (
                                      <li key={`${group.heading}-${item.name}`} className="text-sm text-charcoal">
                                        <span className="font-medium">{item.name}</span>
                                        {item.meta ? <span className="text-xs text-gray-600"> {" · "}{item.meta}</span> : null}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                          {apt.name ? (
                            <p>
                              <span className="font-semibold text-gray-500">Name</span> {apt.name}
                            </p>
                          ) : null}
                          {apt.mobile ? (
                            <p>
                              <span className="font-semibold text-gray-500">Mobile</span>{" "}
                              <span className="tabular-nums">
                                {apt.countryCode ? `${apt.countryCode} ` : ""}
                                {apt.mobile}
                              </span>
                            </p>
                          ) : null}
                          {apt.email ? (
                            <p className="break-all">
                              <span className="font-semibold text-gray-500">Email</span> {apt.email}
                            </p>
                          ) : null}
                          {apt.notes ? (
                            <p>
                              <span className="font-semibold text-gray-500">Notes</span> {apt.notes}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )})}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
