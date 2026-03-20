"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer id="contact" className="bg-charcoal text-white">
      {/* CTA Section */}
      <div className="border-b border-white/10 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="font-display text-3xl md:text-4xl font-light mb-4">
            Join Our World
          </h3>
          <p className="text-gray-300 mb-10 max-w-lg mx-auto text-lg">
            Subscribe for exclusive offers, styling tips, and first access to new services.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold tracking-wide transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Footer Links */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-center md:text-left">
              <h4 className="font-display text-3xl font-semibold uppercase logo-blosm mb-1">BLOSM</h4>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Hair & Beauty • Perth</p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 text-gray-300">
              <Link href="/contact" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Us
              </Link>
              <a href="mailto:info@blosm-salon.com" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@blosm-salon.com
              </a>
              <a href="tel:+61410933555" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +61 410 933 555
              </a>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Blosm Hair & Beauty, Perth. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
