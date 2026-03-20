"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  mobile: string;
  countryCode: string;
  name: string | null;
  email: string | null;
  wallet: number;
};

type LoginModalContextType = {
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  user: User | null;
  token: string | null;
  logout: () => void;
  setAuth: (token: string | null, user: User | null) => void;
  redirectAfterLogin: string | null;
  setRedirectAfterLogin: (path: string | null) => void;
  handleBookNow: (serviceName?: string) => void;
};

const LoginModalContext = createContext<LoginModalContextType | null>(null);

const STORAGE_KEY = "blosm_auth";

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { token: t, user: u } = JSON.parse(stored);
          setToken(t);
          setUser(u);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const openLogin = useCallback(() => setIsOpen(true), []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const setAuth = useCallback((t: string | null, u: User | null) => {
    setToken(t);
    setUser(u);
    if (typeof window !== "undefined") {
      if (t && u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const logout = useCallback(() => setAuth(null, null), [setAuth]);

  const handleBookNow = useCallback(
    (serviceName?: string) => {
      if (typeof window !== "undefined" && serviceName) {
        sessionStorage.setItem("selectedService", serviceName);
      }
      if (token) {
        router.push("/appointment");
      } else {
        setRedirectAfterLogin("/appointment");
        setIsOpen(true);
      }
    },
    [token, router]
  );

  return (
    <LoginModalContext.Provider
      value={{
        isOpen,
        openLogin,
        closeLogin,
        user,
        token,
        logout,
        setAuth,
        redirectAfterLogin,
        setRedirectAfterLogin,
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
