"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhoneCountryField from "@/components/PhoneCountryField";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";
import { submitEnquiry } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(getDefaultCountrySelectValue);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const digits = sanitizeMobileDigits(mobile);
    if (!isValidMobileDigits(digits)) {
      setFormError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits for your mobile number.`);
      return;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setFormError("Please enter a message.");
      return;
    }
    setSubmitting(true);
    try {
      await submitEnquiry({
        name: name.trim(),
        email: email.trim(),
        mobile: digits,
        countryCode: dialFromSelection(countrySelect),
        message: trimmedMessage,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send message");
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
              <h1 className="font-display text-3xl font-light text-charcoal mb-4">Message Sent</h1>
              <p className="text-gray-600 mb-8">
                Thank you, {name}. We&apos;ll get back to you shortly at {email}.
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
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700/80 mb-4">Get in Touch</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-charcoal mb-4">
              Contact Us
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have a question or want to book? Reach out and we&apos;ll respond as soon as we can.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-xl font-medium text-charcoal mb-6">Visit Us</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visit us in Perth or book an appointment online. We&apos;re here to help you look and feel your best.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:info@blosm-salon.com"
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-colors group"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-charcoal">info@blosm-salon.com</p>
                  </div>
                </a>

                <a
                  href="tel:+61410933555"
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-200 transition-colors group"
                >
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                    <svg className="w-6 h-6 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-charcoal">+61 410 933 555</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-display text-xl font-medium text-charcoal mb-6">Send a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="your@email.com"
                  />
                </div>
                <PhoneCountryField
                  id="contact-mobile"
                  label="Mobile"
                  mobile={mobile}
                  countrySelect={countrySelect}
                  onMobileChange={setMobile}
                  onCountryChange={setCountrySelect}
                  rounded="lg"
                />
                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{formError}</p>
                )}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-2">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-lg transition-colors"
                >
                  {submitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
