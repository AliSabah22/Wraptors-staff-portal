'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Settings,
  Bell,
  Shield,
  Palette,
  UserPlus,
  Users,
  Loader2,
  Ban,
  CheckCircle2,
} from 'lucide-react'
import { MetaIntegrationCard } from '@/components/settings/meta-integration-card'
import { useRole } from '@/hooks/useRole'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StaffRoleCode } from '@/lib/auth/roles'
import { useAuth } from '@/hooks/useAuth'

interface StaffRow {
  id: string
  email: string
  full_name: string
  role: StaffRoleCode
  avatar_url: string | null
  is_active: boolean
  created_at?: string
}

export default function SettingsPage() {
  const { can, isCEO } = useRole()
  const { staffUser } = useAuth()

  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'technician' as StaffRoleCode,
  })

  const canReadStaff = can('team.view')
  const canWriteStaff = can('team.manage')

  const fetchStaff = async () => {
    if (!canReadStaff) return
    setLoadingStaff(true)
    setStaffError(null)
    try {
      const res = await fetch('/api/staff')
      const payload = await res.json()
      if (!res.ok || payload.success === false) {
        setStaffError(payload.error ?? 'Failed to load staff users')
      } else {
        setStaff(payload.data ?? [])
      }
    } catch {
      setStaffError('Failed to load staff users')
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => {
    void fetchStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadStaff])

  const inviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteLoading(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const payload = await res.json()
      if (!res.ok || payload.success === false) {
        setInviteError(payload.error ?? 'Failed to invite staff member')
        return
      }
      setInviteOpen(false)
      setInviteForm({ email: '', full_name: '', role: 'technician' })
      await fetchStaff()
    } catch {
      setInviteError('Failed to invite staff member')
    } finally {
      setInviteLoading(false)
    }
  }

  const updateStaff = async (id: string, patch: Partial<Pick<StaffRow, 'role' | 'is_active'>>) => {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const payload = await res.json()
    if (!res.ok || payload.success === false) {
      alert(payload.error ?? 'Update failed')
      return
    }
    await fetchStaff()
  }

  const sortedStaff = useMemo(
    () => [...staff].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [staff]
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-wraptors-muted mt-0.5">Shop configuration</p>
      </div>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-wraptors-gold" /> Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shop-name">Shop name</Label>
            <Input id="shop-name" defaultValue="Wraptors" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="support-email">Support email</Label>
            <Input id="support-email" type="email" defaultValue="support@wraptors.com" className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-wraptors-gold" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-wraptors-muted">
            Configure which events trigger internal notifications. (Placeholder — connect in production.)
          </p>
        </CardContent>
      </Card>

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-wraptors-gold" /> Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wraptors-muted">
            Role-based access control in effect. CEO has full access; receptionist and technician are scoped by permissions.
          </p>
        </CardContent>
      </Card>

      {canReadStaff && (
        <Card className="border-wraptors-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-wraptors-gold" /> Staff Management
            </CardTitle>
            {canWriteStaff && (
              <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" /> Invite Staff Member
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingStaff ? (
              <div className="flex items-center gap-2 text-wraptors-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff…</div>
            ) : staffError ? (
              <p className="text-sm text-red-400">{staffError}</p>
            ) : (
              <div className="space-y-3">
                {sortedStaff.map((member) => {
                  const self = staffUser?.id === member.id
                  return (
                    <div key={member.id} className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/40 p-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={member.full_name} avatarUrl={member.avatar_url} size="md" />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{member.full_name}</p>
                          <p className="text-xs text-wraptors-muted truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <RoleBadge role={member.role} />
                        {member.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400"><Ban className="h-3.5 w-3.5" /> Inactive</span>
                        )}
                        {canWriteStaff && !self && (
                          <>
                            <Select value={member.role} onValueChange={(value) => void updateStaff(member.id, { role: value as StaffRoleCode })}>
                              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ceo">CEO</SelectItem>
                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                <SelectItem value="technician">Technician</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => void updateStaff(member.id, { is_active: !member.is_active })}
                            >
                              {member.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <MetaIntegrationCard />

      <Card className="border-wraptors-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-wraptors-gold" /> More integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wraptors-muted">
            Supabase, Stripe, SMS, and other integrations can be added here.
          </p>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-wraptors-border bg-wraptors-surface">
          <DialogHeader>
            <DialogTitle className="text-white">Invite staff member</DialogTitle>
            <DialogDescription>Send an invite email and create a staff record.</DialogDescription>
          </DialogHeader>

          <form onSubmit={inviteStaff} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-wraptors-muted-light">Full name</Label>
              <Input value={inviteForm.full_name} onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label className="text-wraptors-muted-light">Email</Label>
              <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label className="text-wraptors-muted-light">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v as StaffRoleCode }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteLoading}>{inviteLoading ? 'Inviting…' : 'Send invite'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
