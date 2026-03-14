"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { Lock, Mail, Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isHydrated && user) router.replace("/");
  }, [isHydrated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.ok) {
        router.replace(result.redirect);
        return;
      }
      setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wraptors-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px]"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold tracking-tight text-wraptors-gold">
              WRAPTORS
            </span>
            <span className="text-xs text-wraptors-muted uppercase tracking-widest self-end pb-1">
              Staff
            </span>
          </div>
          <p className="text-sm text-wraptors-muted">
            Internal staff access only
          </p>
        </div>

        <div className="rounded-xl border border-wraptors-border bg-wraptors-charcoal/50 p-8 shadow-gold-glow/5">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-wraptors-gold" />
            <h1 className="text-lg font-semibold text-white">Sign in</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-wraptors-muted-light">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wraptors-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@wraptors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "pl-10 border-wraptors-border bg-wraptors-black/50 text-white placeholder:text-wraptors-muted",
                    "focus-visible:ring-wraptors-gold focus-visible:border-wraptors-gold"
                  )}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-wraptors-muted-light">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wraptors-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "pl-10 border-wraptors-border bg-wraptors-black/50 text-white placeholder:text-wraptors-muted",
                    "focus-visible:ring-wraptors-gold focus-visible:border-wraptors-gold"
                  )}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-wraptors-muted">
            Staff accounts are created by your administrator. Forgot password? Contact your admin.
          </p>
          <p className="mt-3 text-center text-[11px] text-wraptors-muted/70">
            Demo: ceo@wraptors.com · receptionist@wraptors.com · technician@wraptors.com / wraptors2024
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-wraptors-muted/80">
          Wraptors Staff Portal · Confidential
        </p>
      </motion.div>
    </div>
  );
}
