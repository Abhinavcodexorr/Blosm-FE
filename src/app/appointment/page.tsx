"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhoneCountryField from "@/components/PhoneCountryField";
import { getServicesForBooking } from "@/services/api";
import { bookAppointment } from "@/lib/api";
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
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");

  useEffect(() => {
    getServicesForBooking()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = sanitizeMobileDigits(mobile);
    if (!isValidMobileDigits(digits)) {
      setError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits for your mobile number.`);
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
          time: "",
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
                {date ? ` on ${date}` : ""}.
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

            <div>
              <label htmlFor="appt-date" className="block text-sm font-medium text-charcoal mb-2">
                Appointment date
              </label>
              <input
                id="appt-date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
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
