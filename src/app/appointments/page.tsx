"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";
import { getMyBookingsList, type MyAppointment } from "@/lib/api";
import { formatAud } from "@/lib/formatCurrency";

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

function statusStyle(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "bg-green-100 text-green-800";
  if (s === "completed") return "bg-stone-100 text-stone-700";
  if (s === "cancelled" || s === "canceled") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-900";
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
                Log in
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
                <ul className="space-y-4">
                  {list.map((apt) => (
                    <li
                      key={apt._id || `${apt.date}-${apt.time}-${apt.serviceId}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4 md:px-6 md:py-5 border-b border-gray-50 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-medium text-charcoal">
                            {apt.service || "Appointment"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(apt.date)}
                            {apt.time ? ` · ${apt.time}` : ""}
                            {typeof apt.duration === "number" ? ` · ${apt.duration} min` : ""}
                          </p>
                          {formatAud(apt.price) ? (
                            <p className="text-sm font-semibold text-[#8B6914] mt-2 tabular-nums">
                              {formatAud(apt.price)}
                            </p>
                          ) : null}
                        </div>
                        {apt.status ? (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${statusStyle(apt.status)}`}
                          >
                            {apt.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="px-5 py-3 md:px-6 bg-gray-50/50 text-xs text-gray-600 space-y-1">
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
                    </li>
                  ))}
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
