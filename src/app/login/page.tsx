"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/context/LoginModalContext";

export default function LoginPage() {
  const router = useRouter();
  const { openLogin } = useLoginModal();

  useEffect(() => {
    openLogin();
    router.replace("/");
  }, [openLogin, router]);

  return null;
}
