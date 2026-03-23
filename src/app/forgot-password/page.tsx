'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const canUseSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const supabase = canUseSupabase ? createClient() : null

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setSent(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-wraptors-black p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] rounded-xl border border-wraptors-border bg-wraptors-charcoal/50 p-8">
        <h1 className="text-xl font-semibold text-white">Forgot password</h1>
        <p className="text-sm text-wraptors-muted mt-1">Reset your staff portal password</p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-wraptors-muted-light">Check your email — we sent a reset link to <span className="text-white">{email}</span>.</p>
            <Button asChild className="w-full"><Link href="/login">Back to login</Link></Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-wraptors-muted-light">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-wraptors-border bg-wraptors-black/50" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Sending…' : 'Send reset link'}</Button>
            <p className="text-right text-xs"><Link href="/login" className="text-wraptors-muted hover:text-wraptors-gold">Back to login</Link></p>
          </form>
        )}
      </motion.div>
    </div>
  )
}
