import type { Entry } from '@/types'
import { formatCurrency } from '@/lib/parser'

const ICON_MAP: Record<string, { icon: string; bg: string }> = {
  Rent:      { icon: '🏠', bg: '#E6F1FB' },
  Food:      { icon: '🛒', bg: '#E1F5EE' },
  Transport: { icon: '🚗', bg: '#FAEEDA' },
  Utilities: { icon: '⚡', bg: '#F1EFE8' },
  Leisure:   { icon: '🎭', bg: '#FAECE7' },
  Materials: { icon: '🧵', bg: '#EEEDFE' },
  Salaries:  { icon: '💼', bg: '#EEEDFE' },
  Ads:       { icon: '📢', bg: '#FAEEDA' },
  Tools:     { icon: '🔧', bg: '#E1F5EE' },
  Misc:      { icon: '📌', bg: '#F1EFE8' },
}

function getIcon(subcategory: string) {
  return ICON_MAP[subcategory] || { icon: '📌', bg: '#F1EFE8' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface EntryCardProps {
  entry: Entry
  animationIndex?: number
}

export function EntryCard({ entry, animationIndex = 0 }: EntryCardProps) {
  const { icon, bg } = getIcon(entry.subcategory)
  const isPersonal = entry.category === 'Personal'

  return (
    <div
      className="entry-card bg-card rounded-2xl border border-black/8 px-4 py-[14px] flex items-center gap-3"
      style={{ animationDelay: `${animationIndex * 40}ms` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink truncate">
          {entry.subcategory}
        </div>
        <div className="text-[12px] text-gray-400 mt-[1px]">
          {entry.category}
          {entry.note && entry.note.toLowerCase() !== entry.subcategory.toLowerCase()
            ? ` · ${entry.note}`
            : ''
          } · {timeAgo(entry.created_at)}
        </div>
      </div>
      <div className={`text-[16px] font-semibold font-mono ${isPersonal ? 'text-blue-dark' : 'text-indigo-dark'}`}>
        {formatCurrency(entry.amount)}
      </div>
    </div>
  )
}
