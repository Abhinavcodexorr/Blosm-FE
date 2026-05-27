"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  getProfile,
  getSalonAvailability,
  getAppointmentsBookedSlots,
  type BookedSlot,
  type BookAppointmentBody,
  type PublicUser,
  type SalonAvailability,
} from "@/lib/api";
import {
  slotsInOpeningWindow,
  isSlotTimePassedForSelectedDate,
  localDateYmd,
  slotEndTimeHHmm,
  parseHHMM,
  SLOT_STEP_MINUTES,
} from "@/lib/availabilitySlots";
import { formatTimeToAmPm } from "@/lib/timeDisplay";
import { useLoginModal } from "@/context/LoginModalContext";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";
import { SALON_BOOKING_ADDRESS, SALON_BOOKING_NAME } from "@/lib/salonVenue";
import { SHOW_SERVICE_PRICING } from "@/lib/config";
import Link from "next/link";

type BookingStep = "services" | "datetime" | "details";
const AFTER_LOGIN_CONTINUE_DETAILS_KEY = "appointment_continue_to_details_after_login";

function formatBookingDateLong(ymd: string): string {
  if (!ymd) return "";
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return ymd;
  const parts = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(y, mo - 1, d));
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return [weekday, day, month, year].filter(Boolean).join(" ");
}

function applyProfileToBookingDetails(profile: PublicUser) {
  const displayName = profile.name?.trim() || profile.username?.trim() || "";
  return {
    name: displayName,
    email: profile.email?.trim() ?? "",
    mobile: profile.mobile?.trim() ? sanitizeMobileDigits(profile.mobile) : "",
  };
}

export default function AppointmentBookingPage() {
  const { token, authReady, user, openLogin, setRedirectAfterLogin } = useLoginModal();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(() => getDefaultCountrySelectValue());
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceCategories, setServiceCategories] = useState<BookingServiceCategory[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<SalonAvailability | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
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
  const detailsProfileLoadedRef = useRef(false);

  useEffect(() => {
    setClockTick((n) => n + 1);
    const id = window.setInterval(() => setClockTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (step !== "details") return;
    setCountrySelect(getDefaultCountrySelectValue());
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

  function continueToDateTimeStep() {
    setError("");
    if (selectedServiceIds.length === 0 || !selectedServiceIds[0]) {
      setError("Please select at least one service.");
      return;
    }
    const todayYmd = localDateYmd(new Date());
    const startYmd = date && date >= todayYmd ? date : todayYmd;
    const autoDate = nextBookableDate(startYmd);
    if (!autoDate) {
      setError("No available time slots found for the selected services in the upcoming booking window.");
      return;
    }
    setDate(autoDate);
    if (autoDate !== date) setTime("");
    setStep("datetime");
  }

  function goToDateTime() {
    continueToDateTimeStep();
  }

  function goToDetails() {
    setError("");
    if (!token) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AFTER_LOGIN_CONTINUE_DETAILS_KEY, "1");
      }
      setRedirectAfterLogin("/appointment");
      openLogin();
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

  const maxBookAheadYmd = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return localDateYmd(d);
  }, []);

  function hasBookableSlotOnDate(targetYmd: string): boolean {
    const slotDuration = totalSelectedDurationMinutes > 0 ? totalSelectedDurationMinutes : SLOT_STEP_MINUTES;
    const ranges = bookedSlots
      .filter((b) => b.date === targetYmd)
      .map((b) => ({ start: parseHHMM(b.start), end: parseHHMM(b.end) }))
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start);
    const now = new Date();
    return durationFitSlots.some((slot) => {
      if (isSlotTimePassedForSelectedDate(targetYmd, slot, now)) return false;
      const start = parseHHMM(slot);
      if (!Number.isFinite(start)) return false;
      const end = start + slotDuration;
      const overlapsBooked = ranges.some((r) => start < r.end && end > r.start);
      return !overlapsBooked;
    });
  }

  function nextBookableDate(startYmd: string): string {
    if (!startYmd) return "";
    if (hasBookableSlotOnDate(startYmd)) return startYmd;
    const d = new Date(startYmd);
    if (Number.isNaN(d.getTime())) return "";
    while (true) {
      d.setDate(d.getDate() + 1);
      const ymd = localDateYmd(d);
      if (ymd > maxBookAheadYmd) return "";
      if (hasBookableSlotOnDate(ymd)) return ymd;
    }
  }

  useEffect(() => {
    getAppointmentsBookedSlots({ fromDate: localDateYmd(new Date()), toDate: maxBookAheadYmd })
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]));
  }, [maxBookAheadYmd]);

  /** API `availableFrom` / `availableTo` → 15-minute starts inside that range. */
  const baseSlots = useMemo(() => {
    if (!availability?.availableFrom?.trim() || !availability?.availableTo?.trim()) return [];
    return slotsInOpeningWindow(availability.availableFrom, availability.availableTo);
  }, [availability]);

  const durationFitSlots = useMemo(() => {
    const end = parseHHMM(availability?.availableTo ?? "");
    if (!Number.isFinite(end)) return baseSlots;
    if (!(totalSelectedDurationMinutes > 0)) return baseSlots;
    return baseSlots.filter((slot) => {
      const start = parseHHMM(slot);
      return Number.isFinite(start) && start + totalSelectedDurationMinutes <= end;
    });
  }, [baseSlots, availability?.availableTo, totalSelectedDurationMinutes]);

  useEffect(() => {
    if (!time || !date) return;
    void clockTick;
    const now = new Date();
    if (!durationFitSlots.includes(time) || isSlotTimePassedForSelectedDate(date, time, now)) {
      setTime("");
    }
  }, [date, time, durationFitSlots, clockTick]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  useEffect(() => {
    if (!authReady || !token || typeof window === "undefined") return;
    if (sessionStorage.getItem(AFTER_LOGIN_CONTINUE_DETAILS_KEY) !== "1") return;
    sessionStorage.removeItem(AFTER_LOGIN_CONTINUE_DETAILS_KEY);
    setStep("details");
  }, [authReady, token]);

  useEffect(() => {
    if (step !== "details") {
      detailsProfileLoadedRef.current = false;
      return;
    }
    if (!authReady || !token || detailsProfileLoadedRef.current) return;
    detailsProfileLoadedRef.current = true;

    const mergeProfile = (profile: PublicUser) => {
      const fromApi = applyProfileToBookingDetails(profile);
      if (fromApi.name) setName((prev) => prev.trim() || fromApi.name);
      if (fromApi.email) setEmail((prev) => prev.trim() || fromApi.email);
      if (fromApi.mobile) setMobile((prev) => prev.trim() || fromApi.mobile);
    };

    if (user) mergeProfile(user);

    getProfile(token)
      .then(mergeProfile)
      .catch(() => {
        // Keep session cache or manual entry if profile refresh fails.
      });
  }, [step, authReady, token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setRedirectAfterLogin("/appointment");
      openLogin();
      setError("Please sign in to request an appointment.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
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

    const groupedServices = new Map<
      string,
      { serviceId: string; serviceName: string; subServices: { name: string; price: number }[] }
    >();
    for (const row of summaryLines) {
      const key = row.parentServiceId || row.bookingServiceId;
      const existing = groupedServices.get(key);
      if (existing) {
        existing.subServices.push({ name: row.name, price: row.price });
      } else {
        groupedServices.set(key, {
          serviceId: row.parentServiceId || row.bookingServiceId,
          serviceName: row.heading?.trim() || "Service",
          subServices: [{ name: row.name, price: row.price }],
        });
      }
    }

    const primary = summaryLines[0];
    const body: BookAppointmentBody = {
      name: trimmedName,
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
      mobile: digits,
      countryCode,
      date,
      time,
      estimatedTime: totalSelectedDurationMinutes > 0 ? totalSelectedDurationMinutes : undefined,
      notes: userNotes,
      service: primary?.parentServiceId || primary?.bookingServiceId,
      serviceId: primary?.bookingServiceId || primary?.parentServiceId,
      serviceSelections: summaryLines.map((r) => ({
        serviceId: r.bookingServiceId,
        subheading: r.subheading,
        serviceItemName: r.name,
      })),
      services: Array.from(groupedServices.values()),
    };

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
    const formattedStart = time ? formatTimeToAmPm(time) : "";
    const endTime = time && totalSelectedDurationMinutes > 0 ? slotEndTimeHHmm(time, totalSelectedDurationMinutes) : "";
    const formattedEnd = endTime ? formatTimeToAmPm(endTime) : "";
    const groupedBookedServices = Array.from(
      summaryLines.reduce((acc, row) => {
        const heading = (row.heading || "Service").trim() || "Service";
        const list = acc.get(heading) ?? [];
        list.push(row.name);
        acc.set(heading, list);
        return acc;
      }, new Map<string, string[]>())
    );
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-32 pb-20 bg-amber-50/30 min-h-[70vh] flex items-center">
          <div className="max-w-4xl mx-auto px-6 w-full">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-semibold text-charcoal mb-3 text-center">
                Your booking request has been received
              </h1>
              <p className="text-gray-600 mb-8 text-center max-w-lg mx-auto leading-relaxed">
                Our team will get in touch with you shortly to confirm your booking.
              </p>

              <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                    <p className="text-sm font-semibold text-charcoal">{SALON_BOOKING_NAME}</p>
                    <p className="text-xs text-gray-600">{SALON_BOOKING_ADDRESS}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${SALON_BOOKING_NAME}, ${SALON_BOOKING_ADDRESS}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    aria-label={`Open ${SALON_BOOKING_NAME} on Google Maps`}
                  >
                    <iframe
                      title={`Map of ${SALON_BOOKING_NAME}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${SALON_BOOKING_NAME}, ${SALON_BOOKING_ADDRESS}`
                      )}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="pointer-events-none h-28 w-full border-0 sm:h-32"
                    />
                  </a>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Date</p>
                    <p className="text-sm font-semibold text-charcoal">{date ? formatBookingDateLong(date) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Time</p>
                    <p className="text-sm font-semibold text-charcoal">
                      {formattedStart ? `${formattedStart}${formattedEnd ? ` - ${formattedEnd}` : ""}` : "—"}
                    </p>
                  </div>
                  {groupedBookedServices.length > 0 ? (
                    <div className="space-y-3">
                      {groupedBookedServices.map(([heading, items]) => (
                        <div key={heading}>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{heading}</p>
                          <ul className="mt-1 list-disc pl-5 space-y-0.5">
                            {items.map((item, idx) => (
                              <li key={`${heading}-${item}-${idx}`} className="text-sm text-charcoal">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{serviceTitle || "Service details saved."}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/appointments"
                  className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
                >
                  My appointments
                </Link>
                <Link
                  href="/services"
                  className="inline-flex justify-center items-center rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 transition-colors"
                >
                  Make another booking
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-[#f4f4f5] flex min-h-screen flex-col">
      <Header />
      <section
        className={
          step === "services"
            ? "pt-28 pb-24 md:pb-28 lg:pb-4"
            : step === "datetime"
              ? "pt-28 pb-16 md:pb-24 lg:pb-4"
              : "pt-28 pb-16 md:pb-24"
        }
      >
        <div className={step === "services" ? "mx-auto w-full max-w-6xl px-4 sm:px-6" : "max-w-6xl mx-auto px-4 sm:px-6"}>
          {step === "services" ? (
            <div className="flex flex-col gap-3 min-h-[calc(100dvh-7rem)] lg:h-[calc(100vh-7rem)] lg:min-h-0">
              <div className="relative shrink-0 flex flex-col items-center justify-center gap-2 sm:block">
                <h1 className="font-display text-xl font-medium text-charcoal text-center px-11 sm:px-0 sm:text-2xl md:text-3xl">
                  Select services
                </h1>
              </div>

              <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[1fr_290px]">
                <div className="flex flex-col min-h-0 rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="shrink-0 px-4 py-3 border-b border-gray-100">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      Choose one or more
                    </p>
                  </div>
                  <div
                    className="overflow-visible pb-6 lg:flex-1 lg:max-h-none lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1 lg:[scrollbar-gutter:stable]"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehavior: "contain",
                    }}
                  >
                    <BookingServicePicker
                      categories={serviceCategories}
                      selectedIds={selectedServiceIds}
                      onToggle={toggleServiceLine}
                      loading={loading}
                    />
                  </div>
                </div>

                <div className="flex flex-col min-h-0 rounded-2xl border border-amber-100/80 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 shadow-sm ring-1 ring-black/[0.03] overflow-visible lg:overflow-hidden">
                  <div className="shrink-0 px-4 py-3 border-b border-amber-100/60 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500/90">Summary</p>
                    {summaryLines.length > 0 && (
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                        {summaryLines.length} selected
                      </span>
                    )}
                  </div>

                  <div
                    className="overflow-visible lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehavior: "contain",
                    }}
                  >
                    {summaryLines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="text-sm text-gray-400">No services selected yet</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {summaryLines.map((row) => {
                          const priceStr = row.price > 0 ? fmtAudBooking.format(row.price) : "";
                          const meta = formatBookingLineMeta(row.durationLabel, priceStr);
                          return (
                            <li key={row.id} className="px-4 py-3 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600/80 truncate">
                                  {row.heading?.trim() || "Service"}
                                </p>
                                <p className="text-sm font-semibold text-charcoal mt-0.5 truncate">{row.name}</p>
                                {meta && meta !== "—" ? <p className="text-xs text-gray-500 mt-0.5">{meta}</p> : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleServiceLine(row.id)}
                                className="shrink-0 mt-0.5 text-gray-300 hover:text-red-400 transition-colors"
                                aria-label={`Remove ${row.name}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-amber-100/60 bg-white/80 px-4 py-3 space-y-3">
                    {summaryLines.length > 0 && (SHOW_SERVICE_PRICING || totalSelectedDurationMinutes > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {totalSelectedDurationMinutes > 0
                            ? `Est. ${totalSelectedDurationMinutes} mins`
                            : SHOW_SERVICE_PRICING
                              ? "Est. total"
                              : ""}
                        </span>
                        {SHOW_SERVICE_PRICING ? (
                          <span className="font-semibold text-charcoal">
                            {fmtAudBooking.format(summaryLines.reduce((s, r) => s + r.price, 0))}
                          </span>
                        ) : null}
                      </div>
                    )}
                    {error ? <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p> : null}
                    <button
                      type="button"
                      onClick={goToDateTime}
                      className="hidden lg:block w-full rounded-xl bg-amber-500 py-3 text-[15px] font-semibold text-white shadow-md shadow-amber-500/25 transition-colors hover:bg-amber-600 active:scale-[0.99]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-100/70 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.25)] backdrop-blur-sm lg:hidden">
                <div className="mx-auto w-full max-w-6xl">
                  {error ? <p className="mb-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p> : null}
                  <button
                    type="button"
                    onClick={goToDateTime}
                    className="w-full rounded-xl bg-amber-500 py-3 text-[15px] font-semibold text-white shadow-md shadow-amber-500/25 transition-colors hover:bg-amber-600 active:scale-[0.99]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "datetime" ? (
            <div className="flex min-h-0 flex-col lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
              <BookingDayTimeStep
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
                bookedSlots={bookedSlots}
                latestEndTime={availability?.availableTo ?? ""}
              />
            </div>
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
                    helperText="We may call or text about this appointment."
                    borderTone="black"
                  />

                  <div>
                    <label htmlFor="appt-email" className="mb-1.5 block text-sm font-semibold text-charcoal">
                      Email <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="appt-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-charcoal transition-shadow placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      placeholder="your@email.com"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Optional — we&apos;ll send booking updates here if provided.</p>
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
                    {submitting ? "Sending…" : "Send booking request"}
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
                        </div>
                      ) : null}
                      {time ? (
                        <div className={date ? "border-t border-gray-100 pt-3" : ""}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</p>
                          <p className="mt-0.5 font-mono text-base font-semibold text-charcoal">{formatTimeToAmPm(time)}</p>
                          {totalSelectedDurationMinutes > 0 ? (
                            <p className="text-xs text-gray-600">
                              Est. finish{" "}
                              <span className="font-mono font-medium text-charcoal">
                                {formatTimeToAmPm(slotEndTimeHHmm(time, totalSelectedDurationMinutes) || "—")}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/90">
                        Services
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
