'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const canUseSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const supabase = canUseSupabase ? createClient() : null

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 8) return setError('Password must be at least 8 characters')

    setError(null)
    setIsLoading(true)
    if (!supabase) {
      setError('Supabase is not configured. Check environment variables.')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-wraptors-black p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] rounded-xl border border-wraptors-border bg-wraptors-charcoal/50 p-8">
        <h1 className="text-xl font-semibold text-white">Reset password</h1>
        {done ? (
          <p className="mt-4 text-sm text-wraptors-muted-light">Password updated — redirecting to login.</p>
        ) : (
          <form onSubmit={handleUpdate} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-wraptors-muted-light">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-wraptors-border bg-wraptors-black/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-wraptors-muted-light">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="border-wraptors-border bg-wraptors-black/50" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Updating…' : 'Update password'}</Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
