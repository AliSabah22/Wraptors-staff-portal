'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, Shield, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canUseSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const supabase = canUseSupabase ? createClient() : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reason = searchParams.get('reason')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!supabase) {
        setError('Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        return
      }

      const authResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise<{
          data: { user: null; session: null }
          error: { message: string }
        }>((resolve) =>
          window.setTimeout(
            () =>
              resolve({
                data: { user: null, session: null },
                error: {
                  message:
                    "Login request timed out. Check your internet/Supabase connection and try again.",
                },
              }),
            10000
          )
        ),
      ])

      const { error } = authResult

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : error.message
        )
        return
      }

      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      // Use a full navigation after successful sign-in so middleware/session state
      // cannot leave the login screen stuck in loading.
      window.location.assign(redirectTo)
    } catch {
      setError('Could not sign in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-wraptors-black p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold tracking-tight text-wraptors-gold">WRAPTORS</span>
            <span className="text-xs text-wraptors-muted uppercase tracking-widest self-end pb-1">Staff</span>
          </div>
          <p className="text-sm text-wraptors-muted">Sign in to continue</p>
        </div>

        <div className="rounded-xl border border-wraptors-border bg-wraptors-charcoal/50 p-8 shadow-gold-glow/5">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-wraptors-gold" />
            <h1 className="text-lg font-semibold text-white">Staff Portal</h1>
          </div>

          {reason === 'session_expired' && (
            <p className="mb-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">Your session has expired. Please sign in again.</p>
          )}
          {reason === 'account_inactive' && (
            <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">Your account has been deactivated. Contact your administrator.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-wraptors-muted-light">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wraptors-muted" />
                <Input id="email" type="email" placeholder="you@wraptors.com" value={email} onChange={(e) => setEmail(e.target.value)} className={cn('pl-10 border-wraptors-border bg-wraptors-black/50 text-white placeholder:text-wraptors-muted', 'focus-visible:ring-wraptors-gold focus-visible:border-wraptors-gold')} autoComplete="email" required disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-wraptors-muted-light">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wraptors-muted" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={cn('pl-10 pr-10 border-wraptors-border bg-wraptors-black/50 text-white placeholder:text-wraptors-muted', 'focus-visible:ring-wraptors-gold focus-visible:border-wraptors-gold')} autoComplete="current-password" required disabled={loading} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wraptors-muted hover:text-wraptors-gold">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-right text-xs"><Link href="/forgot-password" className="text-wraptors-muted hover:text-wraptors-gold">Forgot password?</Link></p>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</motion.p>
            )}

            <Button type="submit" className="w-full h-11 bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-wraptors-muted">Staff accounts are invite-only and managed by your administrator.</p>
        </div>

        <p className="mt-8 text-center text-xs text-wraptors-muted/80">Wraptors Staff Portal · Confidential</p>
      </motion.div>
    </div>
  )
}
