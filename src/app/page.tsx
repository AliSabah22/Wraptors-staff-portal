"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { getDefaultRedirectForRole } from "@/lib/auth/access";
import { normalizeRole } from "@/lib/auth/roles";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const role = normalizeRole(user.role);
    router.replace(getDefaultRedirectForRole(role));
  }, [isHydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-wraptors-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
    </div>
  );
}
