"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/context/LoginModalContext";
import { sendOtp, verifyOtp } from "@/lib/api";
import PhoneCountryField from "@/components/PhoneCountryField";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";

function CloseModalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-charcoal rounded-full hover:bg-gray-100 transition-all"
      aria-label="Close"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export default function LoginModal() {
  const { isOpen, closeLogin, setAuth, redirectAfterLogin, setRedirectAfterLogin } = useLoginModal();
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(getDefaultCountrySelectValue);
  const countryCode = dialFromSelection(countrySelect);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return;
    }
    setClosing(true);
    const t = setTimeout(() => setMounted(false), 280);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (mounted && isOpen) {
      scrollPosRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPosRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollPosRef.current);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
    };
  }, [mounted, isOpen]);

  const handleClose = () => {
    closeLogin();
    setStep("mobile");
    setMobile("");
    setCountrySelect(getDefaultCountrySelectValue());
    setOtp("");
    setError("");
  };

  const finishLoginAndClose = () => {
    if (redirectAfterLogin) {
      router.push(redirectAfterLogin);
      setRedirectAfterLogin(null);
    }
    handleClose();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = sanitizeMobileDigits(mobile);
    if (!isValidMobileDigits(digits)) {
      setError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits for your mobile number`);
      return;
    }
    setLoading(true);
    try {
      await sendOtp(digits, countryCode);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await verifyOtp(sanitizeMobileDigits(mobile), countryCode, otp);
      setAuth(token, user);
      finishLoginAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const fullNumber = `${countryCode} ${mobile}`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md ${closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop"}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-black/5 ${closing ? "animate-modal-content-out" : "animate-modal-content"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "mobile" && (
          <div className="relative flex flex-col md:flex-row min-h-[440px]">
            <CloseModalButton onClick={handleClose} />
            {/* Left - Branding + Image */}
            <div className="md:w-2/5 relative bg-gradient-to-br from-rose-50 via-amber-50/80 to-rose-100/60 p-8 md:p-10 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-200/30 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase logo-blosm tracking-tight">
                  BLOSM
                </h2>
                <p className="text-sm uppercase tracking-[0.35em] text-charcoal font-bold mt-2">
                  Hair & Beauty
                </p>
              </div>
              <div className="hidden md:block mt-8 rounded-2xl overflow-hidden aspect-[4/5] max-h-[280px] shadow-lg ring-1 ring-black/5">
                <img
                  src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=85"
                  alt="Blosm Salon"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right - Form */}
            <div className="md:w-3/5 p-8 md:p-10 pt-14 md:pt-16 flex flex-col justify-center bg-white">
              <div className="mb-8">
                <h3 className="font-display text-2xl font-light text-charcoal">Welcome back</h3>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <PhoneCountryField
                  id="login-mobile"
                  label="Enter your mobile number"
                  mobile={mobile}
                  countrySelect={countrySelect}
                  onMobileChange={setMobile}
                  onCountryChange={setCountrySelect}
                  rounded="xl"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="relative w-full p-8 md:p-12 pt-14 md:pt-16 max-w-md mx-auto">
            <CloseModalButton onClick={handleClose} />
            <div className="mb-8 pr-2">
              <h2 className="font-display text-2xl font-medium text-charcoal">Verify OTP</h2>
              <p className="text-gray-600 text-sm mt-1">
                Sent to <span className="font-medium text-charcoal">{fullNumber}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="login-otp" className="block text-sm font-medium text-charcoal mb-2">
                  Enter 6-digit code
                </label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center text-2xl tracking-[0.5em] font-medium"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                onClick={() => setStep("mobile")}
                className="w-full text-sm text-gray-500 hover:text-amber-700 transition-colors"
              >
                Change number
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
