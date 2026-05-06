"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhoneCountryField from "@/components/PhoneCountryField";
import BookingDayTimeStep from "@/components/BookingDayTimeStep";
import BookingServicePicker from "@/components/BookingServicePicker";
import {
  getServicesForBooking,
  formatBookingLineMeta,
  type BookingServiceCategory,
} from "@/services/api";
import {
  bookAppointment,
  getSalonAvailability,
  type BookAppointmentBody,
  type SalonAvailability,
} from "@/lib/api";
import {
  slotsInOpeningWindow,
  isSlotTimePassedForSelectedDate,
  localDateYmd,
  slotEndTimeHHmm,
} from "@/lib/availabilitySlots";
import { useLoginModal } from "@/context/LoginModalContext";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";
import Link from "next/link";

type BookingStep = "services" | "datetime" | "details";

function formatBookingDateLong(ymd: string): string {
  if (!ymd) return "";
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return ymd;
  return new Date(y, mo - 1, d).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AppointmentBookingPage() {
  const { token, openLogin } = useLoginModal();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(getDefaultCountrySelectValue);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceCategories, setServiceCategories] = useState<BookingServiceCategory[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<SalonAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  /** Bumps every second on the client so past-slot disabled state stays in sync with the clock. */
  const [clockTick, setClockTick] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [step, setStep] = useState<BookingStep>("services");

  useEffect(() => {
    setClockTick((n) => n + 1);
    const id = window.setInterval(() => setClockTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setCountrySelect((prev) => (prev.startsWith("+61__") ? prev : getDefaultCountrySelectValue()));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (step !== "services") return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [step]);

  useEffect(() => {
    getServicesForBooking()
      .then(setServiceCategories)
      .catch(() => setServiceCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const summaryLines = useMemo(() => {
    const rows: {
      id: string;
      /** Parent `services._id` for this menu category (API `service` / root `serviceId` fallback). */
      parentServiceId: string;
      bookingServiceId: string;
      subheading: string;
      name: string;
      price: number;
      heading: string;
      durationLabel: string;
    }[] = [];
    for (const id of selectedServiceIds) {
      for (const cat of serviceCategories) {
        const line = cat.lines.find((l) => l.id === id);
        if (line) {
          rows.push({
            id: line.id,
            parentServiceId: cat.id,
            bookingServiceId: line.bookingServiceId,
            subheading: (line.subheading ?? "").trim() || cat.heading.trim(),
            name: line.name,
            price: line.price,
            heading: cat.heading,
            durationLabel: (line.durationLabel ?? "").trim(),
          });
          break;
        }
      }
    }
    return rows;
  }, [selectedServiceIds, serviceCategories]);

  const totalSelectedDurationMinutes = useMemo(() => {
    let sum = 0;
    for (const id of selectedServiceIds) {
      for (const cat of serviceCategories) {
        const line = cat.lines.find((l) => l.id === id);
        if (line) {
          const m = line.durationMinutes;
          if (typeof m === "number" && Number.isFinite(m) && m > 0) sum += m;
          break;
        }
      }
    }
    return sum;
  }, [selectedServiceIds, serviceCategories]);

  const fmtAudBooking = useMemo(
    () =>
      new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }),
    []
  );

  function goToDateTime() {
    setError("");
    if (selectedServiceIds.length === 0 || !selectedServiceIds[0]) {
      setError("Please select at least one service.");
      return;
    }
    if (!date) setDate(localDateYmd(new Date()));
    setStep("datetime");
  }

  function goToDetails() {
    setError("");
    if (!date) {
      setError("Please choose an appointment date.");
      return;
    }
    if (!time) {
      setError("Please choose a time slot.");
      return;
    }
    setStep("details");
  }

  function toggleServiceLine(lineId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId]
    );
  }

  useEffect(() => {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    getSalonAvailability()
      .then(setAvailability)
      .catch((e) => setAvailabilityError(e instanceof Error ? e.message : "Could not load opening hours"))
      .finally(() => setAvailabilityLoading(false));
  }, []);

  /** API `availableFrom` / `availableTo` → 15-minute starts inside that range. */
  const baseSlots = useMemo(() => {
    if (!availability?.availableFrom?.trim() || !availability?.availableTo?.trim()) return [];
    return slotsInOpeningWindow(availability.availableFrom, availability.availableTo);
  }, [availability]);

  const maxBookAheadYmd = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return localDateYmd(d);
  }, []);

  useEffect(() => {
    if (!time || !date) return;
    void clockTick;
    const now = new Date();
    if (!baseSlots.includes(time) || isSlotTimePassedForSelectedDate(date, time, now)) {
      setTime("");
    }
  }, [date, time, baseSlots, clockTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    const digits = sanitizeMobileDigits(mobile);
    if (!isValidMobileDigits(digits)) {
      setError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits for your mobile number.`);
      return;
    }
    if (!date) {
      setError("Please choose an appointment date.");
      return;
    }
    if (!time) {
      setError("Please choose a time slot.");
      return;
    }
    if (selectedServiceIds.length === 0 || summaryLines.length === 0) {
      setError("Please select at least one service.");
      return;
    }
    const countryCode = dialFromSelection(countrySelect);
    setSubmitting(true);
    const userNotes = notes.trim();

    let body: BookAppointmentBody = {
      name: trimmedName,
      email: trimmedEmail,
      mobile: digits,
      countryCode,
      date,
      time,
      notes: userNotes,
    };

    if (summaryLines.length === 1) {
      const r = summaryLines[0];
      body = {
        ...body,
        service: r.parentServiceId,
        serviceId: r.bookingServiceId,
        subheading: r.subheading,
        serviceItemName: r.name,
      };
    } else {
      const primary = summaryLines[0];
      body = {
        ...body,
        service: primary.parentServiceId,
        serviceId: primary.parentServiceId,
        serviceSelections: summaryLines.map((r) => ({
          serviceId: r.bookingServiceId,
          subheading: r.subheading,
          serviceItemName: r.name,
        })),
      };
    }

    try {
      await bookAppointment(body, token);
      setServiceTitle(
        summaryLines.map((r) => (r.heading?.trim() ? `${r.heading.trim()}: ${r.name}` : r.name)).join(", ")
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-32 pb-20 bg-amber-50/30 min-h-[60vh] flex items-center">
          <div className="max-w-2xl mx-auto px-6 text-center w-full">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-charcoal mb-4">Booking request received</h1>
              <p className="text-gray-600 mb-8">
                Thank you, {name.trim() || name}. We&apos;ll contact you shortly at {dialFromSelection(countrySelect)}{" "}
                {mobile} to confirm your {serviceTitle || "appointment"}
                {date ? ` on ${date}` : ""}
                {time ? ` at ${time}` : ""}.
              </p>
              <Link
                href="/appointments"
                className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
              >
                View my appointments
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main
      className={`bg-[#f4f4f5] flex flex-col ${
        step === "services" ? "min-h-screen lg:h-dvh lg:overflow-hidden" : "min-h-screen"
      }`}
    >
      <Header />
      <section
        className={
          step === "services"
            ? "flex-1 pt-28 pb-3 md:pb-4 lg:min-h-0 lg:overflow-hidden"
            : "pt-28 pb-16 md:pb-24"
        }
      >
        <div
          className={
            step === "services"
              ? "mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:h-full lg:min-h-0"
              : "max-w-6xl mx-auto px-4 sm:px-6"
          }
        >
          {step === "services" ? (
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
              <div className="relative shrink-0 flex flex-col items-center justify-center gap-3 sm:block">
                <h1 className="font-display text-xl font-medium text-charcoal text-center px-11 sm:px-0 sm:text-2xl md:text-3xl">
                  Select services
                </h1>
                {!token ? (
                  <button
                    type="button"
                    onClick={openLogin}
                    className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Log in
                  </button>
                ) : null}
              </div>

              <div className="mx-auto flex min-h-0 w-full max-w-lg flex-col gap-3 overflow-hidden sm:max-w-2xl lg:max-w-3xl">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <BookingServicePicker
                    categories={serviceCategories}
                    selectedIds={selectedServiceIds}
                    onToggle={toggleServiceLine}
                    loading={loading}
                  />
                </div>
                {error ? (
                  <p className="shrink-0 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
                ) : null}
              </div>

              <div className="mx-auto w-full max-w-lg shrink-0 border-t border-gray-200/80 bg-[#f4f4f5] pt-3 shadow-[0_-8px_28px_-12px_rgba(0,0,0,0.07)] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-w-2xl lg:max-w-3xl">
                <button
                  type="button"
                  onClick={goToDateTime}
                  className="w-full rounded-xl bg-amber-500 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-amber-500/25 transition-colors hover:bg-amber-600 active:scale-[0.99] sm:py-4 sm:text-base"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === "datetime" ? (
            <BookingDayTimeStep
              token={token ?? null}
              openLogin={openLogin}
              onBack={() => {
                setError("");
                setStep("services");
              }}
              onContinue={goToDetails}
              date={date}
              onDateChange={(v) => {
                setDate(v);
                setTime("");
              }}
              time={time}
              onTimeChange={setTime}
              minYmd={localDateYmd(new Date())}
              maxYmd={maxBookAheadYmd}
              baseSlots={baseSlots}
              availabilityLoading={availabilityLoading}
              availabilityError={availabilityError}
              clockTick={clockTick}
              summaryLines={summaryLines}
              totalSelectedDurationMinutes={totalSelectedDurationMinutes}
              stepError={error}
            />
          ) : null}

          {step === "details" ? (
            <div className="mx-auto w-full max-w-2xl space-y-4 lg:max-w-3xl lg:space-y-5">
              <div className="relative flex flex-col items-center justify-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("datetime");
                  }}
                  className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal shadow-sm transition-colors hover:border-amber-200 hover:bg-amber-50"
                  aria-label="Back to date and time"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/90 sm:text-xs">
                  Almost there
                </p>
                <h1 className="font-display px-14 text-center text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">
                  Your details
                </h1>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start lg:gap-5">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.12)] md:p-5"
                >
                  {error ? (
                    <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </p>
                  ) : null}

                  <div>
                    <label htmlFor="appt-name" className="mb-1.5 block text-sm font-semibold text-charcoal">
                      Full name <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="appt-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-black/80 px-4 py-3 text-[15px] text-charcoal transition-shadow placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder={"As you'd like it on the booking"}
                    />
                  </div>

                  <PhoneCountryField
                    id="appt-mobile"
                    label="Mobile"
                    mobile={mobile}
                    countrySelect={countrySelect}
                    onMobileChange={setMobile}
                    onCountryChange={setCountrySelect}
                    rounded="lg"
                    placeholder="e.g. 412 345 678"
                    helperText="We may call or text about this appointment. Country code is fixed to +61."
                    showDigitMeter
                    borderTone="black"
                    lockToDialCode="+61"
                  />

                  <div>
                    <label htmlFor="appt-email" className="mb-1.5 block text-sm font-semibold text-charcoal">
                      Email <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="appt-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-charcoal transition-shadow placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      placeholder="your@email.com"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Confirmation and updates will be sent here.</p>
                  </div>

                  <div>
                    <label htmlFor="appt-notes" className="mb-1.5 block text-sm font-semibold text-charcoal">
                      Notes <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      id="appt-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-charcoal transition-shadow placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      placeholder="Allergies, preferred stylist, parking needs…"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 disabled:opacity-60"
                  >
                    {submitting ? "Sending request…" : "Request appointment"}
                  </button>
                </form>

                <aside className="rounded-2xl border border-amber-100/80 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 p-4 shadow-sm ring-1 ring-black/[0.03] lg:sticky lg:top-28">
                  <h2 className="font-display text-lg font-semibold text-charcoal">Appointment summary</h2>
                  <div className="mt-3 max-h-[min(58vh,28rem)] space-y-3 overflow-y-auto pr-1">
                    <div className="space-y-3 rounded-xl border border-white/80 bg-white/90 p-3 shadow-inner">
                      {date ? (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p>
                          <p className="mt-0.5 text-sm font-semibold text-charcoal">{formatBookingDateLong(date)}</p>
                          <p className="text-xs text-gray-500">{date}</p>
                        </div>
                      ) : null}
                      {time ? (
                        <div className={date ? "border-t border-gray-100 pt-3" : ""}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</p>
                          <p className="mt-0.5 font-mono text-base font-semibold text-charcoal">{time}</p>
                          {totalSelectedDurationMinutes > 0 ? (
                            <p className="text-xs text-gray-600">
                              Est. finish{" "}
                              <span className="font-mono font-medium text-charcoal">
                                {slotEndTimeHHmm(time, totalSelectedDurationMinutes) || "—"}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/90">
                        Services &amp; treatments
                      </p>
                      <ul className="mt-2 space-y-2">
                        {summaryLines.map((row) => {
                          const priceStr = row.price > 0 ? fmtAudBooking.format(row.price) : "";
                          const meta = formatBookingLineMeta(row.durationLabel, priceStr);
                          return (
                            <li
                              key={row.id}
                              className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-sm shadow-sm"
                            >
                              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600/90">
                                {row.heading?.trim() || "Service"}
                              </p>
                              {row.subheading && row.subheading !== row.heading?.trim() ? (
                                <p className="mt-0.5 text-[11px] font-semibold text-charcoal/85">{row.subheading}</p>
                              ) : null}
                              <p className="mt-1 font-semibold text-charcoal">{row.name}</p>
                              {meta && meta !== "—" ? <p className="mt-1 text-xs text-gray-600">{meta}</p> : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {step === "details" ? <Footer /> : null}
    </main>
  );
}
