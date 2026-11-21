// Date ranges for the Overview, worked out on the phone (local time),
// so "today" and "this month" always match the user's own calendar.

export type PeriodKind = 'today' | 'week' | 'month' | 'year' | 'custom'

export interface Period {
  kind: PeriodKind
  offset: number      // 0 = current, -1 = previous, +1 = next
  from?: string       // only for custom
  to?: string         // only for custom
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function periodRange(p: Period): { from: string; to: string } {
  const now = new Date()
  if (p.kind === 'custom' && p.from && p.to) {
    return p.from <= p.to ? { from: p.from, to: p.to } : { from: p.to, to: p.from }
  }
  if (p.kind === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + p.offset)
    return { from: toISO(d), to: toISO(d) }
  }
  if (p.kind === 'week') {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + p.offset * 7)
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
    return { from: toISO(monday), to: toISO(sunday) }
  }
  if (p.kind === 'year') {
    const y = now.getFullYear() + p.offset
    return { from: `${y}-01-01`, to: `${y}-12-31` }
  }
  // month (default)
  const first = new Date(now.getFullYear(), now.getMonth() + p.offset, 1)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  return { from: toISO(first), to: toISO(last) }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const shortMonth = (i: number) => SHORT[i]

export function shortDate(iso: string) {
  const d = fromISO(iso)
  return `${d.getDate()} ${SHORT[d.getMonth()]}`
}

export function periodLabel(p: Period): string {
  const { from, to } = periodRange(p)
  const f = fromISO(from)
  if (p.kind === 'today') {
    if (p.offset === 0) return 'Today'
    if (p.offset === -1) return 'Yesterday'
    return `${shortDate(from)} ${f.getFullYear()}`
  }
  if (p.kind === 'week') {
    if (p.offset === 0) return 'This week'
    if (p.offset === -1) return 'Last week'
    return `${shortDate(from)} – ${shortDate(to)}`
  }
  if (p.kind === 'month') return `${MONTHS[f.getMonth()]} ${f.getFullYear()}`
  if (p.kind === 'year') return String(f.getFullYear())
  return `${shortDate(from)} – ${shortDate(to)} ${fromISO(to).getFullYear()}`
}

export function daysBetween(from: string, to: string) {
  return Math.round((fromISO(to).getTime() - fromISO(from).getTime()) / 86400000) + 1
}

export function rangeCacheKey(from: string, to: string, mode: string) {
  return `range:${from}:${to}:${mode}`
}
