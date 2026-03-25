"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { getMe } from "@/services/auth";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, setAuth, setUser, logout, hydrate } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!user) {
      getMe()
        .then((u) => {
          const refresh = localStorage.getItem("refresh_token") || "";
          setAuth(u, token, refresh);
          setReady(true);
        })
        .catch(() => {
          logout();
          router.replace("/login");
        });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
