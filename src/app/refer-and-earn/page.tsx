"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLoginModal } from "@/context/LoginModalContext";
import { sanitizeMobileDigits } from "@/lib/mobileInput";

const REFERRAL_REWARD_AMOUNT = 100;

export default function ReferAndEarnPage() {
  const { token, user, openLogin } = useLoginModal();
  const [copyLabel, setCopyLabel] = useState("Copy code");
  const [shareLabel, setShareLabel] = useState("Share");

  const referralCode = useMemo(() => sanitizeMobileDigits(user?.mobile ?? ""), [user?.mobile]);

  const handleCopy = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy code"), 1500);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy code"), 1500);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setShareLabel("Share unavailable");
      window.setTimeout(() => setShareLabel("Share"), 1800);
      return;
    }
    try {
      await navigator.share({
        title: "Blosm Refer & Earn",
        text: `Use my referral code: ${referralCode}`,
      });
      setShareLabel("Shared");
      window.setTimeout(() => setShareLabel("Share"), 1500);
    } catch {
      setShareLabel("Share");
    }
  };

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-28 pb-20 md:pt-32 md:pb-24 bg-gradient-to-b from-rose-50/30 via-white to-amber-50/25">
        <div className="max-w-3xl mx-auto px-6">
          {!token ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-800/70 mb-2">Refer & Earn</p>
              <h1 className="font-display text-3xl font-light text-charcoal mb-3">Share and earn rewards</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Log in to view your referral code and start earning ${REFERRAL_REWARD_AMOUNT} for each successful invite.
              </p>
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
                <p className="text-xs uppercase tracking-[0.25em] text-amber-800/70 mb-2">Refer & Earn</p>
                <h1 className="font-display text-3xl md:text-4xl font-light text-charcoal">Invite friends, get paid</h1>
              </div>

              <div className="bg-white rounded-2xl border border-amber-100/80 shadow-lg shadow-amber-100/40 p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 mb-2">Your referral code</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-semibold tracking-[0.2em] text-charcoal tabular-nums">
                    {referralCode || "Unavailable"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!referralCode}
                      className="rounded-xl bg-charcoal text-white px-5 py-3 text-sm font-semibold disabled:opacity-60 hover:bg-charcoal/90 transition-colors"
                    >
                      {copyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={!referralCode}
                      className="rounded-xl border border-charcoal text-charcoal px-5 py-3 text-sm font-semibold disabled:opacity-60 hover:bg-charcoal/5 transition-colors"
                    >
                      {shareLabel}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="font-display text-2xl font-medium text-charcoal mb-4">How this works</h2>
                <ul className="list-disc list-inside space-y-3 text-sm text-gray-700 leading-relaxed">
                  <li>Share your referral code with friends.</li>
                  <li>Your friend signs up using your referral code.</li>
                  <li>
                    You earn ${REFERRAL_REWARD_AMOUNT} for referral and your friend gets ${REFERRAL_REWARD_AMOUNT} for signup.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
