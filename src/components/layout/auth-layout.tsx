"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/app-layout";
import { JobsHydrationGate } from "@/components/jobs/JobsHydrationGate";

const LOGIN_PATH = "/login";

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

  if (pathname === LOGIN_PATH) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <JobsHydrationGate>
        <AppLayout>{children}</AppLayout>
      </JobsHydrationGate>
    </AuthGuard>
  );
}

/**
 * Renders login page without shell; all other routes get AuthGuard + AppLayout.
 * Wrapped in Suspense so usePathname() can resolve without blocking.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
