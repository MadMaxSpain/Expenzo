'use client'
import { useState, useEffect, useCallback } from 'react'
import { TabBar } from '@/components/TabBar'
import { EntryCard } from '@/components/EntryCard'
import { formatCurrency } from '@/lib/parser'
import type { Entry, TimeFilter, ModeFilter } from '@/types'

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#534AB7', Food: '#378ADD', Materials: '#1D9E75',
  Ads: '#D85A30', Salaries: '#BA7517', Transport: '#888780',
  Utilities: '#5F5E5A', Leisure: '#D4537E', Tools: '#639922',
}

function getCategoryColor(sub: string) {
  return CATEGORY_COLORS[sub] || '#888780'
}

interface CategoryTotal { subcategory: string; total: number; color: string }

function buildCategoryTotals(entries: Entry[]): CategoryTotal[] {
  const map: Record<string, number> = {}
  entries.forEach(e => { map[e.subcategory] = (map[e.subcategory] || 0) + e.amount })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([subcategory, total]) => ({ subcategory, total, color: getCategoryColor(subcategory) }))
}

function DonutChart({ totals, grand }: { totals: CategoryTotal[]; grand: number }) {
  if (grand === 0) return <div className="w-24 h-24 rounded-full bg-gray-100 flex-shrink-0" />
  const r = 38
  const circ = 2 * Math.PI * r
  let offset = circ * 0.25
  return (
    <svg width="96" height="96" viewBox="0 0 100 100" className="flex-shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F1EFE8" strokeWidth="14" />
      {totals.map(({ subcategory, total, color }) => {
        const pct = total / grand
        const dash = circ * pct - 2
        const el = (
          <circle
            key={subcategory}
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={`${Math.max(dash, 0)} ${circ}`}
            strokeDashoffset={-offset + circ * 0.25}
            strokeLinecap="round"
          />
        )
        offset += circ * pct
        return el
      })}
      <text x="50" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1A1A18" fontFamily="DM Mono,monospace">
        {formatCurrency(grand)}
      </text>
      <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#888780" fontFamily="DM Sans,sans-serif">
        total
      </text>
    </svg>
  )
}

function BarChart({ entries }: { entries: Entry[] }) {
  const weekMap: Record<string, number> = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 }
  entries.forEach(e => {
    const day = new Date(e.date).getDate()
    if (day <= 7) weekMap['Wk 1'] += e.amount
    else if (day <= 14) weekMap['Wk 2'] += e.amount
    else if (day <= 21) weekMap['Wk 3'] += e.amount
    else weekMap['Wk 4'] += e.amount
  })
  const max = Math.max(...Object.values(weekMap), 1)
  const bars = [
    { label: 'Wk 1', value: weekMap['Wk 1'], color: '#378ADD' },
    { label: 'Wk 2', value: weekMap['Wk 2'], color: '#534AB7' },
    { label: 'Wk 3', value: weekMap['Wk 3'], color: '#1D9E75' },
    { label: 'Wk 4', value: weekMap['Wk 4'], color: '#D85A30' },
  ]
  return (
    <div className="flex flex-col gap-3">
      {bars.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400 w-12 text-right flex-shrink-0">{label}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="text-[12px] font-mono text-gray-400 min-w-[52px]">
            {value > 0 ? formatCurrency(value) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('combined')
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/entries/list?time=${timeFilter}&mode=${modeFilter}`)
    const data = await res.json()
    if (data.entries) setEntries(data.entries)
    setLoading(false)
  }, [timeFilter, modeFilter])

  useEffect(() => { loadEntries() }, [loadEntries])

  const total = entries.reduce((s, e) => s + e.amount, 0)
  const personal = entries.filter(e => e.category === 'Personal').reduce((s, e) => s + e.amount, 0)
  const business = entries.filter(e => e.category === 'Business').reduce((s, e) => s + e.amount, 0)
  const categoryTotals = buildCategoryTotals(entries)
  const pctPersonal = total > 0 ? Math.round((personal / total) * 100) : 0
  const pctBusiness = total > 0 ? Math.round((business / total) * 100) : 0

  return (
    <main className="min-h-screen bg-surface max-w-lg mx-auto pb-24">
      <div className="px-6 pt-14 pb-0 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold tracking-tight text-ink">Overview</h1>
        <a href="/categories"
          className="text-[13px] text-blue font-medium bg-blue-light px-3 py-1.5 rounded-full">
          Categories
        </a>
      </div>

      <div className="flex gap-2 px-5 mt-4 overflow-x-auto no-scrollbar pb-1">
        {TIME_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTimeFilter(value)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-all flex-shrink-0
              ${timeFilter === value ? 'bg-blue text-white border-blue' : 'bg-card text-gray-600 border-black/8'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mx-5 mt-4 bg-gray-100 rounded-xl p-[3px] flex">
        {(['combined', 'personal', 'business'] as ModeFilter[]).map(m => (
          <button
            key={m}
            onClick={() => setModeFilter(m)}
            className={`flex-1 py-2 rounded-[9px] text-[13px] font-medium capitalize transition-all
              ${modeFilter === m ? 'bg-card text-ink shadow-sm' : 'text-gray-400'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mx-5 mt-4 grid grid-cols-2 gap-2.5">
        <div className="col-span-2 bg-blue rounded-2xl px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/70">Total spent</p>
          <p className="text-[28px] font-semibold font-mono text-white mt-1 tracking-tight">
            {loading ? '…' : formatCurrency(total)}
          </p>
          <p className="text-[12px] text-white/60 mt-0.5">{entries.length} entries</p>
        </div>
        <div className="bg-card rounded-2xl border border-black/8 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">Personal</p>
          <p className="text-[20px] font-semibold font-mono text-blue-dark mt-1">{formatCurrency(personal)}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{pctPersonal}%</p>
        </div>
        <div className="bg-card rounded-2xl border border-black/8 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">Business</p>
          <p className="text-[20px] font-semibold font-mono text-[#3C3489] mt-1">{formatCurrency(business)}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{pctBusiness}%</p>
        </div>
      </div>

      {categoryTotals.length > 0 && (
        <div className="mx-5 mt-4 bg-card rounded-2xl border border-black/8 p-5">
          <h3 className="text-[14px] font-semibold text-ink mb-4">By category</h3>
          <div className="flex items-center gap-5">
            <DonutChart totals={categoryTotals} grand={total} />
            <div className="flex flex-col gap-2.5 flex-1">
              {categoryTotals.slice(0, 5).map(({ subcategory, total: t, color }) => (
                <div key={subcategory} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[13px] text-gray-600 flex-1">{subcategory}</span>
                  <span className="text-[13px] font-semibold font-mono text-ink">{formatCurrency(t)}</span>
                  <span className="text-[11px] text-gray-400 min-w-[30px] text-right">
                    {Math.round((t / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mx-5 mt-4 bg-card rounded-2xl border border-black/8 p-5">
          <h3 className="text-[14px] font-semibold text-ink mb-4">Trend this month</h3>
          <BarChart entries={entries} />
        </div>
      )}

      <div className="mx-5 mt-4">
        <h3 className="text-[18px] font-semibold text-ink mb-3">All entries</h3>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="bg-card rounded-2xl border border-black/8 px-5 py-8 text-center">
            <p className="text-[32px] mb-2">✦</p>
            <p className="text-[14px] text-gray-400">No entries for this period</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                animationIndex={i}
                onDelete={(id) => setEntries(prev => prev.filter(e => e.id !== id))}
                onEdit={(id, updated) => setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e))}
              />
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </main>
  )
}