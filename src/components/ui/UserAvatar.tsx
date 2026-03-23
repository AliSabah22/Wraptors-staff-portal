import { cn } from '@/lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  }

  return (
    <div
      className={cn(
        'rounded-full bg-wraptors-gold/15 border border-wraptors-gold/30 flex items-center justify-center font-medium text-wraptors-gold',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
