"use client";

import { LoginModalProvider } from "@/context/LoginModalContext";
import LoginModal from "./LoginModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoginModalProvider>
      {children}
      <LoginModal />
    </LoginModalProvider>
  );
}
