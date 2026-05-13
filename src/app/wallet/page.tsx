"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";
import { getProfile, type WalletHistoryEntry } from "@/lib/api";
import { formatAud } from "@/lib/formatCurrency";

function isDebitType(type: string) {
  return type.toLowerCase() === "debit";
}

function formatAppointmentDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isSignupBonus(entry: WalletHistoryEntry) {
  const haystack = `${entry.type} ${entry.note ?? ""}`.toLowerCase();
  return /signup|sign[- ]?up|welcome|joining|first[- ]?login|new[- ]?user/.test(
    haystack
  );
}

function isReferralBonus(entry: WalletHistoryEntry) {
  const haystack = `${entry.type} ${entry.note ?? ""}`.toLowerCase();
  return /refer|invite/.test(haystack);
}

function getEntryLabel(entry: WalletHistoryEntry) {
  if (entry.appointmentId) {
    const when = [formatAppointmentDate(entry.appointmentDate), entry.appointmentTime]
      .filter((x): x is string => !!x)
      .join(" · ");
    return {
      title: "Appointment",
      when,
    };
  }
  if (isSignupBonus(entry)) {
    return { title: "Signup bonus", when: "" };
  }
  if (isReferralBonus(entry)) {
    return { title: "Referral bonus", when: "" };
  }
  return {
    title: entry.note?.trim() || "Wallet",
    when: "",
  };
}

export default function WalletPage() {
  const { token, user, openLogin, setAuth } = useLoginModal();
  const [profileRefreshing, setProfileRefreshing] = useState(false);

  const historySorted = useMemo(() => {
    const rows: WalletHistoryEntry[] = user?.walletHistory ?? [];
    return [...rows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user?.walletHistory]);

  /** Avoid showing the same bonus twice: summary comes from `user.bonuses`, history hides matching ledger rows. */
  const historyForDisplay = useMemo(() => {
    const signupFromApi = typeof user?.bonuses?.signupBonus === "number";
    const referralFromApi = typeof user?.bonuses?.referralBonus === "number" && (user?.bonuses?.referralBonus ?? 0) > 0;
    return historySorted.filter((entry) => {
      if (signupFromApi && isSignupBonus(entry)) return false;
      if (referralFromApi && isReferralBonus(entry)) return false;
      return true;
    });
  }, [historySorted, user?.bonuses?.signupBonus, user?.bonuses?.referralBonus]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setProfileRefreshing(true);
    getProfile(token)
      .then((fresh) => {
        if (!cancelled) setAuth(token, fresh);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, setAuth]);

  const balanceLabel = formatAud(user?.wallet ?? 0) ?? "$0";
  const signupBonus = user?.bonuses?.signupBonus;
  const referralBonus = user?.bonuses?.referralBonus;
  const showSignupBonus = typeof signupBonus === "number";
  const showReferralBonus = typeof referralBonus === "number" && referralBonus > 0;
  const showBonusesBlock = showSignupBonus || showReferralBonus;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/20">
        <div className="max-w-2xl mx-auto px-6">
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
              <p className="text-gray-600 mb-8 leading-relaxed">Sign in to view your Blosm balance and rewards.</p>
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
                  Use on future visits when your stylist confirms eligibility.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100/80 shadow-lg shadow-amber-100/50 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-8 text-white relative">
                  <p className="text-sm font-medium text-amber-100/90 mb-1">Available balance</p>
                  <p
                    className={`font-sans text-4xl md:text-5xl font-semibold tabular-nums tracking-tight transition-opacity ${profileRefreshing ? "opacity-70" : ""}`}
                  >
                    {balanceLabel}
                  </p>
                  {profileRefreshing && (
                    <p className="text-xs text-amber-100/80 mt-2">Syncing with your account…</p>
                  )}
                </div>
                <div className="px-6 py-6 space-y-4">
                  {showBonusesBlock ? (
                    <div className="rounded-xl border border-amber-100/80 bg-amber-50/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700/90 mb-2">
                        Bonuses
                      </p>
                      <div className="space-y-1.5">
                        {showSignupBonus ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-charcoal">Signup bonus</span>
                            <span className="font-semibold tabular-nums text-emerald-700">
                              +{formatAud(signupBonus ?? 0) ?? "$0"}
                            </span>
                          </div>
                        ) : null}
                        {showReferralBonus ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-charcoal">Referral bonus</span>
                            <span className="font-semibold tabular-nums text-emerald-700">
                              +{formatAud(referralBonus ?? 0) ?? "$0"}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Loyalty rewards and top-ups will appear here after they are added to your account.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/services"
                      className="inline-flex justify-center items-center rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90 transition-colors"
                    >
                      Browse services
                    </Link>
                    <Link
                      href="/appointments"
                      className="inline-flex justify-center items-center rounded-full border-2 border-amber-200 px-6 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-50 transition-colors"
                    >
                      My appointments
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
                  <h2 className="font-display text-lg font-medium text-charcoal">Wallet history</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Transactions from your account</p>
                </div>
                {profileRefreshing && historySorted.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-gray-500">Loading history…</p>
                ) : historyForDisplay.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-gray-500">No wallet activity yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {historyForDisplay.map((entry) => {
                      const debit = isDebitType(entry.type);
                      const amountStr = formatAud(entry.amount) ?? "$0";
                      const label = getEntryLabel(entry);
                      return (
                        <li key={entry._id} className="px-5 py-4 hover:bg-amber-50/30 transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-charcoal">
                                {label.title}
                              </p>
                              {label.when && (
                                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                                  {label.when}
                                </p>
                              )}
                            </div>
                            <div
                              className={`text-base font-semibold tabular-nums shrink-0 ${
                                debit ? "text-rose-700" : "text-emerald-700"
                              }`}
                            >
                              {debit ? "−" : "+"}
                              {formatAud(Math.abs(entry.amount)) ?? amountStr}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
