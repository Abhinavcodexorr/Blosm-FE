"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhoneCountryField from "@/components/PhoneCountryField";
import BookingDateField from "@/components/BookingDateField";
import { getServicesForBooking } from "@/services/api";
import { bookAppointment, getSalonAvailability, type SalonAvailability } from "@/lib/api";
import {
  halfHourSlotsInWindow,
  isSlotTimePassedForSelectedDate,
  localDateYmd,
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

type ServiceOption = { id: string; title: string };

export default function AppointmentBookingPage() {
  const { token } = useLoginModal();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(getDefaultCountrySelectValue);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [services, setServices] = useState<ServiceOption[]>([]);
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

  useEffect(() => {
    setClockTick((n) => n + 1);
    const id = window.setInterval(() => setClockTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    getServicesForBooking()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    getSalonAvailability()
      .then(setAvailability)
      .catch((e) => setAvailabilityError(e instanceof Error ? e.message : "Could not load opening hours"))
      .finally(() => setAvailabilityLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || services.length === 0) return;
    const selected = sessionStorage.getItem("selectedService");
    if (!selected) return;
    const match = services.find((s) => s.title === selected);
    if (match) {
      setServiceId(match.id);
      sessionStorage.removeItem("selectedService");
    }
  }, [services]);

  /** 1) API gives `availableFrom` / `availableTo` → 2) half-hour starts only inside that range. */
  const baseSlots = useMemo(() => {
    if (!availability?.availableFrom?.trim() || !availability?.availableTo?.trim()) return [];
    return halfHourSlotsInWindow(availability.availableFrom, availability.availableTo);
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
    const countryCode = dialFromSelection(countrySelect);
    setSubmitting(true);
    const selectedService = services.find((s) => s.id === serviceId);
    try {
      await bookAppointment(
        {
          name,
          mobile: digits,
          countryCode,
          email,
          serviceId,
          date,
          time,
          notes: notes || undefined,
        },
        token
      );
      setServiceTitle(selectedService?.title || "");
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
        <section className="pt-32 pb-20 bg-rose-50/30 min-h-[60vh] flex items-center">
          <div className="max-w-2xl mx-auto px-6 text-center w-full">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-charcoal mb-4">Booking request received</h1>
              <p className="text-gray-600 mb-8">
                Thank you, {name}. We&apos;ll contact you shortly at {dialFromSelection(countrySelect)} {mobile} to
                confirm your {serviceTitle || "appointment"}
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
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-20 bg-rose-50/30">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700/80 mb-4">Book your visit</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-charcoal mb-4">Book appointment</h1>
            <p className="text-gray-600">Fill in your details and we&apos;ll get back to you to confirm your slot.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-2xl space-y-6"
          >
            <div>
              <label htmlFor="appt-name" className="block text-sm font-medium text-charcoal mb-2">
                Name
              </label>
              <input
                id="appt-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Your full name"
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
              helperText="We'll text you about your booking. Enter 8–11 digits after the country code."
              showDigitMeter
            />

            <div>
              <label htmlFor="appt-email" className="block text-sm font-medium text-charcoal mb-2">
                Email
              </label>
              <input
                id="appt-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

            <div>
              <label htmlFor="appt-service" className="block text-sm font-medium text-charcoal mb-2">
                Service
              </label>
              <select
                id="appt-service"
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white disabled:opacity-60"
              >
                <option value="">{loading ? "Loading…" : "Select a service"}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <BookingDateField
              id="appt-date"
              label="Appointment date"
              min={localDateYmd(new Date())}
              max={maxBookAheadYmd}
              value={date}
              onChange={(v) => {
                setDate(v);
                setTime("");
              }}
            />

            <div>
              <span className="block text-sm font-medium text-charcoal mb-2">Preferred time</span>
              {!date ? (
                <p className="text-sm text-gray-500">Choose a date first.</p>
              ) : availabilityLoading ? (
                <p className="text-sm text-gray-500">Loading available hours…</p>
              ) : availabilityError ? (
                <p className="text-sm text-amber-800 bg-amber-50 px-4 py-3 rounded-lg">{availabilityError}</p>
              ) : baseSlots.length === 0 ? (
                <p className="text-sm text-gray-600">No slots in the configured range. Please contact us.</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    {availability
                      ? `Within ${availability.availableFrom}–${availability.availableTo} · 30 min slots`
                      : null}
                    {date === localDateYmd(new Date()) ? (
                      <span className="block mt-1 text-gray-400">
                        Times that have already passed today are shown but cannot be selected.
                      </span>
                    ) : null}
                  </p>
                  <div
                    className="grid grid-cols-3 sm:grid-cols-4 gap-2"
                    role="listbox"
                    aria-label="Time slots"
                  >
                    {baseSlots.map((slot) => {
                      void clockTick;
                      const now = new Date();
                      const passed = date
                        ? isSlotTimePassedForSelectedDate(date, slot, now)
                        : false;
                      const selected = time === slot && !passed;
                      return (
                        <button
                          key={slot}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={passed}
                          aria-disabled={passed}
                          title={passed ? "This time has already passed" : undefined}
                          onClick={() => {
                            if (!passed) setTime(slot);
                          }}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            passed
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 pointer-events-none"
                              : selected
                                ? "border-amber-500 bg-amber-50 text-amber-900"
                                : "border-gray-200 bg-white text-charcoal hover:border-amber-300 hover:bg-amber-50/50"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div>
              <label htmlFor="appt-notes" className="block text-sm font-medium text-charcoal mb-2">
                Notes (optional)
              </label>
              <textarea
                id="appt-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                placeholder="Any special requests?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? "Booking…" : "Request appointment"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
