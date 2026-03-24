"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";
import { getProfile } from "@/lib/api";

function formatWalletAud(value: number | undefined) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ProfilePage() {
  const { token, user, openLogin, setAuth } = useLoginModal();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setSyncing(true);
    getProfile(token)
      .then((fresh) => {
        if (!cancelled) setAuth(token, fresh);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-b from-rose-50/30 via-white to-amber-50/20">
        <div className="max-w-lg mx-auto px-6">
          {!token ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <h1 className="font-display text-3xl font-light text-charcoal mb-3">Your profile</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">Sign in to view and manage your account.</p>
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-amber-700"
              >
                Log in
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-800/70 mb-2">Account</p>
                <h1 className="font-display text-3xl md:text-4xl font-light text-charcoal">Profile</h1>
                {syncing && <p className="text-xs text-gray-500 mt-2">Updating…</p>}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                <div className="p-5 md:p-6">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Name</p>
                  <p className="text-lg font-medium text-charcoal">{user?.name || "—"}</p>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Mobile</p>
                  <p className="text-lg text-charcoal">
                    {user?.mobile ? `${user.countryCode || ""} ${user.mobile}` : "—"}
                  </p>
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Email</p>
                  <p className="text-lg text-charcoal break-all">{user?.email || "—"}</p>
                </div>
                <Link
                  href="/wallet"
                  className="flex items-center justify-between gap-4 p-5 md:p-6 hover:bg-amber-50/40 transition-colors"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Wallet</p>
                    <p className="text-lg font-semibold text-amber-800 tabular-nums">{formatWalletAud(user?.wallet)}</p>
                  </div>
                  <span className="text-sm font-medium text-amber-800 shrink-0">View wallet →</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/appointment"
                  className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
                >
                  Book appointment
                </Link>
                <Link
                  href="/services"
                  className="inline-flex justify-center items-center rounded-full border-2 border-amber-200 px-6 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
                >
                  Browse services
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
