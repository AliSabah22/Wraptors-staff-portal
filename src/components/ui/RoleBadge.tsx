import { cn } from '@/lib/utils'
import type { StaffRoleCode } from '@/lib/auth/roles'

const labels: Record<StaffRoleCode, string> = {
  ceo: 'CEO',
  receptionist: 'Receptionist',
  technician: 'Technician',
}

const styles: Record<StaffRoleCode, string> = {
  ceo: 'bg-wraptors-gold/15 text-wraptors-gold border-wraptors-gold/30',
  receptionist: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  technician: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export function RoleBadge({ role, className }: { role: StaffRoleCode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        styles[role],
        className
      )}
    >
      {labels[role]}
    </span>
  )
}
