"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServicesForBooking } from "@/services/api";
import { bookAppointment, getAvailableSlots } from "@/lib/api";
import { useLoginModal } from "@/context/LoginModalContext";
import PhoneCountryField from "@/components/PhoneCountryField";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";

type ServiceOption = { id: string; title: string };

export default function AppointmentPage() {
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
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [serviceTitle, setServiceTitle] = useState(""); // for success message

  useEffect(() => {
    getServicesForBooking()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && services.length > 0) {
      const selected = sessionStorage.getItem("selectedService");
      if (selected) {
        const match = services.find((s) => s.title === selected);
        if (match) {
          setServiceId(match.id);
          sessionStorage.removeItem("selectedService");
        }
      }
    }
  }, [services]);

  const fetchSlots = useCallback(async () => {
    if (!serviceId || !date) {
      setSlots([]);
      setTime("");
      return;
    }
    setSlotsLoading(true);
    setTime("");
    try {
      const data = await getAvailableSlots(date, serviceId);
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [serviceId, date]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-charcoal mb-4">Booking Request Received</h1>
              <p className="text-gray-600 mb-8">
                Thank you, {name}. We&apos;ll contact you shortly at {dialFromSelection(countrySelect)} {mobile} to confirm your {serviceTitle || "appointment"}{date ? ` on ${date}${time ? ` at ${time}` : ""}` : ""}.
              </p>
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
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700/80 mb-4">Book Your Visit</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-charcoal mb-4">
              Book Appointment
            </h1>
            <p className="text-gray-600">
              Fill in your details and we&apos;ll get back to you to confirm your slot.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded-2xl space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">Name</label>
              <input
                id="name"
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
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
            )}

            <div>
              <label htmlFor="service" className="block text-sm font-medium text-charcoal mb-2">Service</label>
              <select
                id="service"
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white disabled:opacity-60"
              >
                <option value="">{loading ? "Loading…" : "Select a service"}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-charcoal mb-2">Preferred Date</label>
              <input
                id="date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-charcoal mb-2">Preferred Time</label>
              <select
                id="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={slotsLoading || !serviceId || !date}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white disabled:opacity-60"
              >
                <option value="">
                  {slotsLoading ? "Loading slots…" : !serviceId || !date ? "Select service and date first" : slots.length === 0 ? "No slots available" : "Select a time slot"}
                </option>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-charcoal mb-2">Notes (optional)</label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                placeholder="Any special requests?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !time}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? "Booking…" : "Request Appointment"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
