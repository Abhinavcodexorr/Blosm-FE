"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/context/LoginModalContext";
import { getProfile, loginWithEmail, redeemInviteCode, registerUser } from "@/lib/api";
import PhoneCountryField from "@/components/PhoneCountryField";
import { dialFromSelection, getDefaultCountrySelectValue } from "@/lib/countryDialCodes";
import {
  sanitizeMobileDigits,
  isValidMobileDigits,
  MOBILE_DIGITS_MIN,
  MOBILE_DIGITS_LEN,
} from "@/lib/mobileInput";
import { ENQUIRY_THANKS_PENDING_LOGIN_KEY } from "@/lib/enquiryLoginRedirect";

const REDIRECT_KEY = "blosm_redirect_after_login";
const MIN_PASSWORD_LEN = 6;

type AuthMode = "signup" | "login" | "invite";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const inputClass =
  "w-full px-4 py-3.5 border border-gray-200/80 rounded-xl bg-gray-50/50 focus:outline-none focus:border-gray-400 focus:bg-white text-base transition-all duration-200 placeholder:text-gray-400";

export default function LoginModal() {
  const { isOpen, closeLogin, setAuth, redirectAfterLogin, setRedirectAfterLogin } = useLoginModal();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [countrySelect, setCountrySelect] = useState(getDefaultCountrySelectValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteAction, setInviteAction] = useState<"apply" | "skip" | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollPosRef = useRef(0);
  const skipRestoreScrollRef = useRef(false);

  const inviteSeenStorageKey = (userId: string) => `blosm_invite_seen_${userId}`;

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
      window.scrollTo(0, skipRestoreScrollRef.current ? 0 : scrollPosRef.current);
      skipRestoreScrollRef.current = false;
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
    };
  }, [mounted, isOpen]);

  const resetForm = () => {
    setMode("signup");
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setMobile("");
    setCountrySelect(getDefaultCountrySelectValue());
    setInviteCode("");
    setInviteMessage("");
    setInviteAction(null);
    setPendingToken(null);
    setPendingUserId(null);
    setError("");
  };

  const handleClose = (restoreScroll = true) => {
    skipRestoreScrollRef.current = !restoreScroll;
    closeLogin();
    resetForm();
  };

  const navigateAfterLoginSuccess = () => {
    const fallbackTarget =
      typeof window !== "undefined" ? sessionStorage.getItem(REDIRECT_KEY) : null;
    const target = redirectAfterLogin || fallbackTarget;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    if (target) {
      setRedirectAfterLogin(null);
      handleClose(false);
      router.push(target, { scroll: true });
      return;
    }
    if (
      currentPath === "/contact" &&
      typeof window !== "undefined" &&
      sessionStorage.getItem(ENQUIRY_THANKS_PENDING_LOGIN_KEY) === "1"
    ) {
      sessionStorage.removeItem(ENQUIRY_THANKS_PENDING_LOGIN_KEY);
      handleClose(false);
      router.push("/", { scroll: true });
      return;
    }
    handleClose();
  };

  const maybeShowInviteStep = (token: string, userId: string, isFirstLogin: boolean) => {
    const seenInviteStep =
      typeof window !== "undefined" && localStorage.getItem(inviteSeenStorageKey(userId)) === "1";
    if (isFirstLogin && !seenInviteStep) {
      setPendingToken(token);
      setPendingUserId(userId);
      setMode("invite");
      return true;
    }
    return false;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const emailTrimmed = email.trim();
    const digits = sanitizeMobileDigits(mobile);

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidEmail(emailTrimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidMobileDigits(digits)) {
      setError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits for your mobile number.`);
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }

    setLoading(true);
    try {
      const { token, user, isFirstLogin } = await registerUser({
        username: trimmedName,
        email: emailTrimmed,
        mobile: digits,
        countryCode: dialFromSelection(countrySelect),
        password,
      });
      setAuth(token, user);
      if (!maybeShowInviteStep(token, user._id, isFirstLogin)) {
        navigateAfterLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailTrimmed = email.trim();

    if (!isValidEmail(emailTrimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const { token, user, isFirstLogin } = await loginWithEmail(emailTrimmed, password);
      setAuth(token, user);
      if (!maybeShowInviteStep(token, user._id, isFirstLogin)) {
        navigateAfterLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const completeLoginAfterInviteStep = async (token: string, userId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(inviteSeenStorageKey(userId), "1");
    }
    try {
      const fresh = await getProfile(token);
      setAuth(token, fresh);
    } catch {
      // Keep auth payload if profile refresh fails.
    }
    navigateAfterLoginSuccess();
  };

  const handleSkipInvite = async () => {
    if (!pendingToken || !pendingUserId) {
      navigateAfterLoginSuccess();
      return;
    }
    setInviteAction("skip");
    setLoading(true);
    setError("");
    try {
      await completeLoginAfterInviteStep(pendingToken, pendingUserId);
    } finally {
      setInviteAction(null);
      setLoading(false);
    }
  };

  const handleApplyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken || !pendingUserId) {
      navigateAfterLoginSuccess();
      return;
    }
    const code = sanitizeMobileDigits(inviteCode);
    if (!code) {
      setError("Invite code is required.");
      return;
    }
    if (!isValidMobileDigits(code)) {
      setError(`Enter ${MOBILE_DIGITS_MIN}–${MOBILE_DIGITS_LEN} digits invite code.`);
      return;
    }
    setInviteAction("apply");
    setLoading(true);
    setError("");
    setInviteMessage("");
    try {
      const result = await redeemInviteCode(pendingToken, code);
      setInviteMessage(
        result.message ||
        `Invite applied successfully. Referrer gets $${result.creditedAmount ?? 100}.`
      );
      await completeLoginAfterInviteStep(pendingToken, pendingUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply invite code");
    } finally {
      setInviteAction(null);
      setLoading(false);
    }
  };

  const switchMode = (next: "signup" | "login") => {
    setMode(next);
    setError("");
    setPassword("");
    setShowPassword(false);
  };

  if (!mounted) return null;

  return (
    <ModalBackdrop closing={closing} onClose={() => handleClose()}>
      <div
        className={`bg-white rounded-[28px] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] w-full ${mode === "invite" ? "max-w-xl" : "max-w-[900px]"} overflow-hidden ring-1 ring-white/20 ${closing ? "animate-modal-content-out" : "animate-modal-content"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(mode === "signup" || mode === "login") && (
          <div className="relative">
            <button
              type="button"
              onClick={() => handleClose()}
              className="absolute top-5 right-5 z-20 p-2 text-gray-400 hover:text-charcoal rounded-full hover:bg-gray-100 transition-all duration-200 hover:rotate-90"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col md:flex-row min-h-[520px] md:min-h-[560px]">
              {/* Branding panel - dark elegant */}
              <div className="md:w-[42%] relative bg-gradient-to-br from-[#1a1a1a] via-[#2a2218] to-[#1a1610] p-8 md:p-10 flex flex-col justify-between overflow-hidden">
                {/* Animated floating orbs */}
                <div className="animate-float-orb absolute top-8 right-8 w-28 h-28 rounded-full bg-gradient-to-br from-amber-400/15 to-amber-600/5 blur-2xl" />
                <div className="animate-float-orb-delayed absolute bottom-12 left-4 w-20 h-20 rounded-full bg-gradient-to-tr from-rose-400/10 to-amber-500/10 blur-xl" />
                <div className="animate-float-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-500/[0.04] blur-3xl" />

                {/* Content */}
                <div className="relative z-10">
                  <h2 className="font-display text-4xl md:text-[2.6rem] font-bold uppercase logo-blosm tracking-tight leading-tight">
                    BLOSM
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.4em] text-amber-200/70 font-medium mt-2">
                    Hair & Beauty
                  </p>
                  <div className="w-10 h-[2px] bg-gradient-to-r from-amber-400/60 to-transparent mt-5 rounded-full" />
                </div>

                {/* Image */}
                <div className="hidden md:block relative z-[1] mt-6 flex-1 min-h-[240px] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=85"
                    alt="Blosm Salon"
                    className="w-full h-full min-h-[260px] object-cover object-[center_20%] opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/50 via-transparent to-transparent" />
                </div>

                {/* Bottom tagline */}
                <p className="hidden md:block relative z-10 text-[11px] text-amber-200/40 tracking-wider mt-5 font-light">
                  Perth&apos;s premier women-only salon
                </p>
              </div>

              {/* Form panel */}
              <div className="md:w-[58%] p-8 md:p-10 md:pl-12 flex flex-col justify-center bg-white pt-14 md:pt-10">
                <div key={mode} className="animate-slide-in">
                  <h3 className="font-display text-[1.65rem] font-light text-charcoal mb-1.5 tracking-tight">
                    {mode === "signup" ? "Create your account" : "Welcome back"}
                  </h3>
                  <p className="text-[13px] text-gray-400 mb-7 leading-relaxed">
                    {mode === "signup"
                      ? "Sign up to book appointments and manage your wallet."
                      : "Sign in with the email and password you used when signing up."}
                  </p>

                  <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-4">
                    {mode === "signup" && (
                      <div className="modal-input-focus rounded-xl">
                        <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Name
                        </label>
                        <input
                          id="signup-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Smith"
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div className="modal-input-focus rounded-xl">
                      <label htmlFor="auth-email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete={mode === "signup" ? "email" : "username"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>

                    {mode === "signup" && (
                      <PhoneCountryField
                        id="signup-mobile"
                        label="Mobile number"
                        mobile={mobile}
                        countrySelect={countrySelect}
                        onMobileChange={setMobile}
                        onCountryChange={setCountrySelect}
                        rounded="xl"
                        placeholder="e.g. 410 123 456"
                        labelClassName="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                      />
                    )}

                    <div className="modal-input-focus rounded-xl">
                      <label htmlFor="auth-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                          className={`${inputClass} pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-charcoal rounded-lg transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50/80 border border-red-100">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 btn-gold-shimmer disabled:opacity-70 disabled:animate-none text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-800/15 hover:shadow-xl hover:shadow-amber-800/20 hover:-translate-y-[1px] active:translate-y-0 mt-1"
                    >
                      {loading
                        ? mode === "signup"
                          ? "Creating account..."
                          : "Signing in..."
                        : mode === "signup"
                          ? "Sign up"
                          : "Sign in"}
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-gray-400">or</span></div>
                  </div>

                  <p className="text-sm text-center text-gray-500">
                    {mode === "signup" ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("login")}
                          className="font-semibold text-amber-700 hover:text-amber-800 transition-colors underline decoration-amber-300/50 underline-offset-2 hover:decoration-amber-500"
                        >
                          Sign in
                        </button>
                      </>
                    ) : (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("signup")}
                          className="font-semibold text-amber-700 hover:text-amber-800 transition-colors underline decoration-amber-300/50 underline-offset-2 hover:decoration-amber-500"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "invite" && (
          <div className="relative p-8 md:p-12 pt-14 md:pt-12">
            <div className="max-w-lg mx-auto">
              <InviteStep
                inviteCode={inviteCode}
                setInviteCode={setInviteCode}
                error={error}
                inviteMessage={inviteMessage}
                loading={loading}
                inviteAction={inviteAction}
                onApply={handleApplyInvite}
                onSkip={handleSkipInvite}
              />
            </div>
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

function ModalBackdrop({
  closing,
  onClose,
  children,
}: {
  closing: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md ${closing ? "animate-modal-backdrop-out" : "animate-modal-backdrop"}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}


function InviteStep({
  inviteCode,
  setInviteCode,
  error,
  inviteMessage,
  loading,
  inviteAction,
  onApply,
  onSkip,
}: {
  inviteCode: string;
  setInviteCode: (v: string) => void;
  error: string;
  inviteMessage: string;
  loading: boolean;
  inviteAction: "apply" | "skip" | null;
  onApply: (e: React.FormEvent) => void;
  onSkip: () => void;
}) {
  return (
    <>
      <div className="mb-7">
        <h2 className="font-display text-2xl font-medium text-charcoal">Have an invite code?</h2>
      </div>
      <form onSubmit={onApply} className="space-y-5">
        <div>
          <label htmlFor="invite-code" className="block text-sm font-medium text-charcoal mb-2">
            Invite code
          </label>
          <input
            id="invite-code"
            type="text"
            inputMode="numeric"
            maxLength={MOBILE_DIGITS_LEN}
            value={inviteCode}
            onChange={(e) => setInviteCode(sanitizeMobileDigits(e.target.value))}
            placeholder="e.g. 410933555"
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && inviteMessage && <p className="text-sm text-emerald-700">{inviteMessage}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all"
        >
          {loading && inviteAction === "apply" ? "Applying..." : "Apply"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="w-full text-sm text-gray-500 hover:text-amber-700 transition-colors disabled:opacity-60"
        >
          {loading && inviteAction === "skip" ? "Skipping..." : "Skip"}
        </button>
      </form>
    </>
  );
}
