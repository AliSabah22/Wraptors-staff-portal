export const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(v)

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(d))

export const formatDateRange = (s: string | Date, e: string | Date) =>
  `${formatDate(s)} → ${formatDate(e)}`

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7) return `${d}d ago`
  return formatDate(date)
}

export const formatPhone = (p: string) => {
  const c = p.replace(/\D/g, '')
  const m = c.match(/^(\d{3})(\d{3})(\d{4})$/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : p
}

export const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, max - 3) + '...'
