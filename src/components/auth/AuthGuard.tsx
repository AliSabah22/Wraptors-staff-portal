"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { canAccessRoute, getUnauthorizedRedirect } from "@/lib/auth/access";
import { normalizeRole } from "@/lib/auth/roles";

const LOGIN_PATH = "/login";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps portal content: redirects to login if not authenticated,
 * redirects to role default if authenticated but no access to current route.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  const [checkDone, setCheckDone] = useState(false);

  // Client-only: trigger rehydration (store uses skipHydration) and set hydrated when done
  useEffect(() => {
    try {
      const persistApi = (useAuthStore as unknown as { persist?: { rehydrate: () => void; onFinishHydration: (cb: () => void) => () => void } }).persist;
      if (persistApi?.onFinishHydration && persistApi?.rehydrate) {
        const unsub = persistApi.onFinishHydration(() => setHydrated());
        persistApi.rehydrate();
        return unsub;
      }
    } catch {
      // persist API missing or rehydration failed; fallback timeout will set hydrated
    }
    setHydrated();
  }, [setHydrated]);

  // Fallback: if rehydration never completes, unblock after a short delay
  useEffect(() => {
    const t = setTimeout(() => setHydrated(), 400);
    return () => clearTimeout(t);
  }, [setHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    if (pathname === LOGIN_PATH) {
      setCheckDone(true);
      return;
    }

    if (!user) {
      router.replace(LOGIN_PATH);
      return;
    }

    const role = normalizeRole(user.role);
    const allowed = canAccessRoute(role, pathname);
    if (!allowed) {
      router.replace(getUnauthorizedRedirect(role));
      return;
    }

    setCheckDone(true);
  }, [pathname, user, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  if (pathname === LOGIN_PATH) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  const role = normalizeRole(user.role);
  if (!canAccessRoute(role, pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-wraptors-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
