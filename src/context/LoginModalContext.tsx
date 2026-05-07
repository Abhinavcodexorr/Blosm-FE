"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/api";
import { AUTH_EXPIRED_EVENT } from "@/lib/api";

type LoginModalContextType = {
  authReady: boolean;
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  user: PublicUser | null;
  token: string | null;
  logout: () => void;
  setAuth: (token: string | null, user: PublicUser | null) => void;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (path: string | null) => void;
  handleBookNow: (serviceName?: string) => void;
};

const LoginModalContext = createContext<LoginModalContextType | null>(null);

const STORAGE_KEY = "blosm_auth";
const SESSION_STORAGE_KEY = "blosm_auth";
const REDIRECT_KEY = "blosm_redirect_after_login";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function clearBrowserAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const setRedirectAfterLoginSafe = useCallback((path: string | null) => {
    setRedirectAfterLogin(path);
    if (typeof window === "undefined") return;
    if (path && path.trim()) {
      sessionStorage.setItem(REDIRECT_KEY, path);
    } else {
      sessionStorage.removeItem(REDIRECT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored =
          localStorage.getItem(STORAGE_KEY) ||
          sessionStorage.getItem(SESSION_STORAGE_KEY) ||
          readCookie(STORAGE_KEY);
        if (stored) {
          const { token: t, user: u } = JSON.parse(stored);
          if (t && u) {
            setToken(t);
            setUser(u);
          } else {
            clearBrowserAuthStorage();
          }
        }
        const storedRedirect = sessionStorage.getItem(REDIRECT_KEY);
        if (storedRedirect && storedRedirect.trim()) {
          setRedirectAfterLogin(storedRedirect);
        }
      } catch {
        clearBrowserAuthStorage();
      } finally {
        setAuthReady(true);
      }
    } else {
      setAuthReady(true);
    }
  }, []);

  const openLogin = useCallback(() => setIsOpen(true), []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const setAuth = useCallback((t: string | null, u: PublicUser | null) => {
    setToken(t);
    setUser(u);
    if (typeof window !== "undefined") {
      if (t && u) {
        const payload = JSON.stringify({ token: t, user: u });
        localStorage.setItem(STORAGE_KEY, payload);
        sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
      } else {
        clearBrowserAuthStorage();
      }
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null, null);
    setRedirectAfterLoginSafe(null);
    setIsOpen(true);
  }, [setAuth, setRedirectAfterLoginSafe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAuthExpired = () => {
      setAuth(null, null);
      setRedirectAfterLoginSafe(null);
      setIsOpen(true);
      router.push("/");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
  }, [router, setAuth, setRedirectAfterLoginSafe]);

  const handleBookNow = useCallback(
    (serviceName?: string) => {
      if (typeof window !== "undefined" && serviceName) {
        sessionStorage.setItem("selectedService", serviceName);
      }
      router.push("/appointment");
    },
    [router]
  );

  return (
    <LoginModalContext.Provider
      value={{
        authReady,
        isOpen,
        openLogin,
        closeLogin,
        user,
        token,
        logout,
        setAuth,
        redirectAfterLogin,
        setRedirectAfterLogin: setRedirectAfterLoginSafe,
        handleBookNow,
      }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
