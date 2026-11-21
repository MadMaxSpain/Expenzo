'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { TabBar } from '@/components/TabBar'
import { EntryCard } from '@/components/EntryCard'
import { formatCurrency } from '@/lib/parser'
import { readCache, writeCache, fetchAndCache } from '@/lib/cache'
import {
  type Period, type PeriodKind, periodRange, periodLabel, rangeCacheKey,
  daysBetween, fromISO, toISO, shortDate, shortMonth,
} from '@/lib/period'
import { buildCsv, downloadCsv, type ExportSort } from '@/lib/export'
import type { Entry, ModeFilter } from '@/types'

const KINDS: { label: string; value: PeriodKind }[] = [
  { label: 'Day', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const PERSONAL = '#378ADD'
const BUSINESS = '#534AB7'

// Fixed colours for known categories, the rest get a stable colour from this list
const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#534AB7', Food: '#378ADD', Materials: '#1D9E75', Ads: '#D85A30',
  Salaries: '#BA7517', Transport: '#888780', Utilities: '#5F5E5A',
  Leisure: '#D4537E', Tools: '#639922', Trash: '#E24B4A', Misc: '#B4B2A9',
}
const EXTRA = ['#0F6E56', '#993556', '#185FA5', '#854F0B', '#7F77DD', '#3B6D11', '#993C1D', '#5DCAA5', '#ED93B1', '#85B7EB']

function getCategoryColor(sub: string) {
  if (CATEGORY_COLORS[sub]) return CATEGORY_COLORS[sub]
  let h = 0
  for (const c of sub) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return EXTRA[h % EXTRA.length]
}

interface CategoryTotal { subcategory: string; total: number; count: number; color: string }

function buildCategoryTotals(entries: Entry[]): CategoryTotal[] {
  const map: Record<string, { total: number; count: number }> = {}
  entries.forEach(e => {
    map[e.subcategory] = map[e.subcategory] || { total: 0, count: 0 }
    map[e.subcategory].total += e.amount
    map[e.subcategory].count += 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([subcategory, v]) => ({ subcategory, ...v, color: getCategoryColor(subcategory) }))
}

function DonutChart({ totals, grand }: { totals: CategoryTotal[]; grand: number }) {
  if (grand === 0) return <div className="w-24 h-24 rounded-full bg-gray-100 flex-shrink-0" />
  const r = 38
  const circ = 2 * Math.PI * r
  let offset = circ * 0.25
  return (
    <svg width="104" height="104" viewBox="0 0 100 100" className="flex-shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F1EFE8" strokeWidth="14" />
      {totals.map(({ subcategory, total, color }) => {
        const pct = total / grand
        const dash = circ * pct - 1.5
        const el = (
          <circle key={subcategory} cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${Math.max(dash, 0)} ${circ}`}
            strokeDashoffset={-offset + circ * 0.25} />
        )
        offset += circ * pct
        return el
      })}
      <text x="50" y="47" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1A1A18" fontFamily="DM Mono,monospace">
        {formatCurrency(grand)}
      </text>
      <text x="50" y="58" textAnchor="middle" fontSize="7.5" fill="#888780" fontFamily="DM Sans,sans-serif">total</text>
    </svg>
  )
}

// ---- Spending chart: daily, weekly or monthly bars depending on the range ----

interface Bucket { key: string; label: string; full: string; personal: number; business: number }

function buildBuckets(entries: Entry[], from: string, to: string): { buckets: Bucket[]; unit: string } {
  const days = daysBetween(from, to)
  const buckets: Bucket[] = []
  const index: Record<string, Bucket> = {}
  const add = (b: Bucket) => { buckets.push(b); index[b.key] = b }

  let unit: string
  let keyOf: (iso: string) => string

  if (days <= 31) {
    unit = 'day'
    for (let d = fromISO(from); toISO(d) <= to; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d)
      add({ key: iso, label: String(d.getDate()), full: shortDate(iso), personal: 0, business: 0 })
    }
    keyOf = iso => iso
  } else if (days <= 92) {
    unit = 'week'
    const start = fromISO(from)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    for (let d = new Date(start); toISO(d) <= to; d.setDate(d.getDate() + 7)) {
      const iso = toISO(d)
      add({ key: iso, label: shortDate(iso).split(' ')[0], full: `Week of ${shortDate(iso)}`, personal: 0, business: 0 })
    }
    keyOf = iso => {
      const d = fromISO(iso)
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return toISO(d)
    }
  } else {
    unit = 'month'
    const end = fromISO(to)
    for (let d = new Date(fromISO(from).getFullYear(), fromISO(from).getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      add({ key, label: shortMonth(d.getMonth()).slice(0, 1), full: `${shortMonth(d.getMonth())} ${d.getFullYear()}`, personal: 0, business: 0 })
    }
    keyOf = iso => { const d = fromISO(iso); return `${d.getFullYear()}-${d.getMonth()}` }
  }

  entries.forEach(e => {
    const b = index[keyOf(e.date)]
    if (!b) return
    if (e.category === 'Business') b.business += e.amount
    else b.personal += e.amount
  })
  return { buckets, unit }
}

function SpendingChart({ entries, from, to }: { entries: Entry[]; from: string; to: string }) {
  const { buckets, unit } = useMemo(() => buildBuckets(entries, from, to), [entries, from, to])
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSelected(null), [from, to])

  const max = Math.max(...buckets.map(b => b.personal + b.business), 1)
  const total = buckets.reduce((s, b) => s + b.personal + b.business, 0)
  // Average only over periods that have already started
  const today = toISO(new Date())
  const elapsed = buckets.filter(b => unit === 'month' || b.key <= today).length || 1
  const avg = total / elapsed
  const sel = buckets.find(b => b.key === selected)
  const labelEvery = Math.ceil(buckets.length / 8)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-ink">Spending by {unit}</h3>
        <span className="text-[12px] text-gray-400">avg {formatCurrency(avg)} / {unit}</span>
      </div>
      <div className="h-5 text-[12px] text-gray-600 mb-2">
        {sel ? (
          <span>
            <b className="font-semibold text-ink">{sel.full}</b> · {formatCurrency(sel.personal + sel.business)}
            {sel.personal > 0 && sel.business > 0 &&
              <span className="text-gray-400"> (P {formatCurrency(sel.personal)} · B {formatCurrency(sel.business)})</span>}
          </span>
        ) : <span className="text-gray-300">Tap a bar for details</span>}
      </div>

      <div className="relative h-32 flex items-end gap-[2px]">
        <div className="absolute left-0 right-0 border-t border-dashed border-gray-200 pointer-events-none"
          style={{ bottom: `${(avg / max) * 100}%` }} />
        {buckets.map(b => {
          const t = b.personal + b.business
          const active = selected === b.key
          return (
            <button key={b.key} onClick={() => setSelected(active ? null : b.key)}
              className="flex-1 h-full flex flex-col justify-end min-w-0" aria-label={`${b.full}: ${formatCurrency(t)}`}>
              <div className="w-full rounded-t-[3px] overflow-hidden flex flex-col justify-end transition-all duration-500"
                style={{ height: `${(t / max) * 100}%`, opacity: selected && !active ? 0.35 : 1, minHeight: t > 0 ? 2 : 0 }}>
                <div style={{ height: `${t ? (b.business / t) * 100 : 0}%`, background: BUSINESS }} />
                <div style={{ height: `${t ? (b.personal / t) * 100 : 0}%`, background: PERSONAL }} />
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex gap-[2px] mt-1">
        {buckets.map((b, i) => (
          <span key={b.key} className="flex-1 text-center text-[10px] text-gray-400 min-w-0 overflow-hidden">
            {i % labelEvery === 0 ? b.label : ''}
          </span>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: PERSONAL }} />Personal</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: BUSINESS }} />Business</span>
        <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-gray-400" />Average</span>
      </div>
    </div>
  )
}

// ---- Page ----

export default function OverviewPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [period, setPeriod] = useState<Period>({ kind: 'month', offset: 0 })
  const [modeFilter, setModeFilter] = useState<ModeFilter>('combined')
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [showAllCats, setShowAllCats] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Custom range inputs default to this month
  const monthRange = periodRange({ kind: 'month', offset: 0 })
  const [customFrom, setCustomFrom] = useState(monthRange.from)
  const [customTo, setCustomTo] = useState(toISO(new Date()))

  const { from, to } = periodRange(period)
  const cacheKey = rangeCacheKey(from, to, modeFilter)

  const loadEntries = useCallback(async () => {
    const cached = readCache<Entry[]>(cacheKey)
    if (cached) { setEntries(cached); setLoading(false) } else { setLoading(true) }
    const fresh = await fetchAndCache<Entry[]>(`/api/entries/list?from=${from}&to=${to}&mode=${modeFilter}`, 'entries', cacheKey)
    if (fresh) setEntries(fresh)
    setLoading(false)
  }, [cacheKey, from, to, modeFilter])

  useEffect(() => { loadEntries() }, [loadEntries])

  // A category picked in one period may not exist in the next
  useEffect(() => { setSelectedCat(null); setShowAllCats(false) }, [from, to, modeFilter])

  function chooseKind(kind: PeriodKind) {
    if (kind === 'custom') setPeriod({ kind, offset: 0, from: customFrom, to: customTo })
    else setPeriod({ kind, offset: 0 })
  }

  function updateCustom(f: string, t: string) {
    setCustomFrom(f); setCustomTo(t)
    if (f && t) setPeriod({ kind: 'custom', offset: 0, from: f, to: t })
  }

  function updateEntries(update: (prev: Entry[]) => Entry[]) {
    setEntries(prev => {
      const next = update(prev)
      writeCache(cacheKey, next)
      return next
    })
  }

  const visible = selectedCat ? entries.filter(e => e.subcategory === selectedCat) : entries
  const total = entries.reduce((s, e) => s + e.amount, 0)
  const personal = entries.filter(e => e.category === 'Personal').reduce((s, e) => s + e.amount, 0)
  const business = entries.filter(e => e.category === 'Business').reduce((s, e) => s + e.amount, 0)
  const categoryTotals = buildCategoryTotals(entries)
  const listedCats = showAllCats ? categoryTotals : categoryTotals.slice(0, 6)
  const pctPersonal = total > 0 ? Math.round((personal / total) * 100) : 0
  const pctBusiness = total > 0 ? Math.round((business / total) * 100) : 0
  const selectedTotal = visible.reduce((s, e) => s + e.amount, 0)

  async function exportCsv(sort: ExportSort) {
    setShowExport(false)
    const parts = ['expenzo', from === to ? from : `${from}_to_${to}`]
    if (modeFilter !== 'combined') parts.push(modeFilter)
    if (selectedCat) parts.push(selectedCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    await downloadCsv(buildCsv(visible, sort), `${parts.join('_')}.csv`)
  }

  return (
    <main className="min-h-screen bg-surface max-w-lg mx-auto pb-28">

      {/* Export options */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowExport(false) }}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <h3 className="text-[18px] font-semibold text-ink">Export to Excel</h3>
            <p className="text-[13px] text-gray-400 mt-1 mb-5">
              {visible.length} entries · {periodLabel(period)}
              {modeFilter !== 'combined' && ` · ${modeFilter}`}{selectedCat && ` · ${selectedCat}`}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => exportCsv('category')}
                className="w-full text-left px-4 py-3.5 rounded-xl border border-black/8 bg-gray-50 active:scale-[0.99] transition-transform">
                <div className="text-[14px] font-medium text-ink">Sorted by category</div>
                <div className="text-[12px] text-gray-400">Biggest categories first, with totals at the bottom</div>
              </button>
              <button onClick={() => exportCsv('date')}
                className="w-full text-left px-4 py-3.5 rounded-xl border border-black/8 bg-gray-50 active:scale-[0.99] transition-transform">
                <div className="text-[14px] font-medium text-ink">Sorted by date</div>
                <div className="text-[12px] text-gray-400">Oldest to newest, with totals at the bottom</div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-14 pb-0 flex items-center justify-between">
        <h1 className="text-[32px] font-semibold tracking-tight text-ink">Overview</h1>
        <Link href="/categories" className="text-[13px] text-blue font-medium bg-blue-light px-3 py-1.5 rounded-full">
          Categories
        </Link>
      </div>

      {/* Period type */}
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto no-scrollbar pb-1">
        {KINDS.map(({ label, value }) => (
          <button key={value} onClick={() => chooseKind(value)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-all flex-shrink-0
              ${period.kind === value ? 'bg-blue text-white border-blue' : 'bg-card text-gray-600 border-black/8'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Previous / next, or custom dates */}
      {period.kind === 'custom' ? (
        <div className="mx-5 mt-3 flex items-center gap-2">
          <label className="flex-1 bg-card border border-black/8 rounded-xl px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-gray-400">From</span>
            <input type="date" value={customFrom} max={customTo} onChange={e => updateCustom(e.target.value, customTo)}
              className="w-full bg-transparent outline-none text-[14px] text-ink" />
          </label>
          <span className="text-gray-300">→</span>
          <label className="flex-1 bg-card border border-black/8 rounded-xl px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-gray-400">To</span>
            <input type="date" value={customTo} min={customFrom} onChange={e => updateCustom(customFrom, e.target.value)}
              className="w-full bg-transparent outline-none text-[14px] text-ink" />
          </label>
        </div>
      ) : (
        <div className="mx-5 mt-3 flex items-center justify-between bg-card border border-black/8 rounded-xl px-1 py-1">
          <button onClick={() => setPeriod(p => ({ ...p, offset: p.offset - 1 }))}
            className="w-10 h-9 rounded-lg flex items-center justify-center text-gray-500 active:bg-gray-100" aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => setPeriod(p => ({ ...p, offset: 0 }))} className="text-[15px] font-semibold text-ink">
            {periodLabel(period)}
          </button>
          <button onClick={() => setPeriod(p => ({ ...p, offset: p.offset + 1 }))} disabled={period.offset >= 0}
            className="w-10 h-9 rounded-lg flex items-center justify-center text-gray-500 active:bg-gray-100 disabled:opacity-25" aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      )}

      <div className="mx-5 mt-3 bg-gray-100 rounded-xl p-[3px] flex">
        {(['combined', 'personal', 'business'] as ModeFilter[]).map(m => (
          <button key={m} onClick={() => setModeFilter(m)}
            className={`flex-1 py-2 rounded-[9px] text-[13px] font-medium capitalize transition-all
              ${modeFilter === m ? 'bg-card text-ink shadow-sm' : 'text-gray-400'}`}>
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

      {entries.length > 0 && (
        <div className="mx-5 mt-4 bg-card rounded-2xl border border-black/8 p-5">
          <SpendingChart entries={entries} from={from} to={to} />
        </div>
      )}

      {categoryTotals.length > 0 && (
        <div className="mx-5 mt-4 bg-card rounded-2xl border border-black/8 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-ink">By category</h3>
            <span className="text-[12px] text-gray-400">Tap one to see its entries</span>
          </div>
          <div className="flex justify-center mb-4">
            <DonutChart totals={categoryTotals} grand={total} />
          </div>
          <div className="flex flex-col">
            {listedCats.map(({ subcategory, total: t, count, color }) => {
              const active = selectedCat === subcategory
              return (
                <button key={subcategory} onClick={() => setSelectedCat(active ? null : subcategory)}
                  className={`flex items-center gap-2 px-2 py-2 -mx-2 rounded-lg text-left transition-colors
                    ${active ? 'bg-blue-light' : 'active:bg-gray-50'} ${selectedCat && !active ? 'opacity-45' : ''}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[13px] text-ink flex-1 truncate">
                    {subcategory} <span className="text-gray-400">· {count}</span>
                  </span>
                  <span className="text-[13px] font-semibold font-mono text-ink">{formatCurrency(t)}</span>
                  <span className="text-[11px] text-gray-400 w-9 text-right">{Math.round((t / total) * 100)}%</span>
                </button>
              )
            })}
          </div>
          {categoryTotals.length > 6 && (
            <button onClick={() => setShowAllCats(s => !s)} className="mt-2 text-[13px] text-blue font-medium">
              {showAllCats ? 'Show less' : `Show all ${categoryTotals.length} categories`}
            </button>
          )}
        </div>
      )}

      <div className="mx-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          {selectedCat ? (
            <button onClick={() => setSelectedCat(null)}
              className="flex items-center gap-2 bg-blue-light text-blue-dark text-[13px] font-medium pl-3 pr-2 py-1.5 rounded-full">
              {selectedCat} · {formatCurrency(selectedTotal)}
              <span className="w-4 h-4 rounded-full bg-blue/20 flex items-center justify-center text-[11px] leading-none">×</span>
            </button>
          ) : (
            <h3 className="text-[18px] font-semibold text-ink">All entries</h3>
          )}
          <button onClick={() => setShowExport(true)} disabled={visible.length === 0}
            className="flex items-center gap-1.5 text-[13px] text-blue font-medium px-3 py-1.5 rounded-full border border-blue/30 disabled:opacity-30">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2V9M7 9L4 6M7 9L10 6M2.5 12H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="bg-card rounded-2xl border border-black/8 px-5 py-8 text-center">
            <p className="text-[32px] mb-2">✦</p>
            <p className="text-[14px] text-gray-400">No entries for this period</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                animationIndex={Math.min(i, 8)}
                onDelete={id => updateEntries(prev => prev.filter(e => e.id !== id))}
                onEdit={(id, updated) => updateEntries(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e))}
              />
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </main>
  )
}
