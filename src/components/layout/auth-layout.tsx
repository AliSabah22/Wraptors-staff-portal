"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";

const PUBLIC_AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"] as const;

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-wraptors-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
    </div>
  );
}

/**
 * Inner layout that uses pathname - may be null during SSR / initial client.
 */
function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname && PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  // Middleware now owns auth redirects. Avoid client-side hydration deadlocks by
  // rendering app shell directly on protected routes.
  return <AppLayout>{children}</AppLayout>;
}

/**
 * Renders login page without shell; all other routes get AuthGuard + AppLayout.
 * Wrapped in Suspense so usePathname() can resolve without blocking.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutInner>{children}</AuthLayoutInner>;
}
