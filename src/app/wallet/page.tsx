"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";

function formatWalletAud(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function WalletPage() {
  const { token, user, openLogin } = useLoginModal();

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/20">
        <div className="max-w-lg mx-auto px-6">
          {!token ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6.75A2.25 2.25 0 0 1 6.25 4.5h11.5A2.25 2.25 0 0 1 20 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 17.25V6.75Z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 9.5h16" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 14h.01" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-charcoal mb-3">Your wallet</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Sign in to view your Blosm balance and rewards.
              </p>
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex w-full sm:w-auto justify-center items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-amber-700"
              >
                Log in
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-800/70 mb-2">Wallet</p>
                <h1 className="font-display text-3xl md:text-4xl font-light text-charcoal">Blosm balance</h1>
                <p className="text-gray-600 mt-2 text-sm md:text-base">
                  Use on future visits — credits may apply to services when available.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100/80 shadow-lg shadow-amber-100/50 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-8 text-white">
                  <p className="text-sm font-medium text-amber-100/90 mb-1">Available balance</p>
                  <p className="font-display text-4xl md:text-5xl font-light tracking-tight">
                    {formatWalletAud(user?.wallet ?? 0)}
                  </p>
                </div>
                <div className="px-6 py-6 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Loyalty rewards and top-ups will appear here. Need to book? Your wallet can be used when your stylist confirms eligibility at checkout.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/services"
                      className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
                    >
                      Browse services
                    </Link>
                    <Link
                      href="/appointment"
                      className="inline-flex justify-center items-center rounded-full border-2 border-amber-200 px-6 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
                    >
                      Book appointment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
