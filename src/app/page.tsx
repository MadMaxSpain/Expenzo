'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { TabBar } from '@/components/TabBar'
import { Toast, useToast } from '@/components/Toast'
import { ParseChips } from '@/components/ParseChips'
import { EntryCard } from '@/components/EntryCard'
import { parseInput, parseInputWithCustomCategories } from '@/lib/parser'
import type { Entry, ParsedEntry } from '@/types'

export default function LogPage() {
  const [value, setValue] = useState('')
  const [parsed, setParsed] = useState<ParsedEntry | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [saving, setSaving] = useState(false)
  const [customCategories, setCustomCategories] = useState<{id:string; name:string; category:string; emoji:string}[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { visible, msg, showToast } = useToast()

  useEffect(() => { inputRef.current?.focus() }, [])

  const loadEntries = useCallback(async () => {
    const res = await fetch('/api/entries/list?time=today&mode=combined')
    const data = await res.json()
    if (data.entries) setEntries(data.entries)
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])
  useEffect(() => {
  async function loadCustomCategories() {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.categories) setCustomCategories(data.categories)
  }
  loadCustomCategories()
}, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    parseInputWithCustomCategories(v, customCategories).then((result) => {
      setParsed(result)
    })
  }

  async function saveEntry() {
    if (!parsed || saving) return

    const tempEntry: Entry = {
      id: `temp-${Date.now()}`,
      user_id: '',
      amount: parsed.amount,
      category: parsed.category,
      subcategory: parsed.subcategory,
      note: parsed.note,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    }
    setEntries(prev => [tempEntry, ...prev])
    setValue('')
    setParsed(null)
    showToast('Entry saved')
    inputRef.current?.focus()

    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed.amount,
          category: parsed.category,
          subcategory: parsed.subcategory,
          note: parsed.note,
          date: new Date().toISOString().split('T')[0],
        }),
      })
      const data = await res.json()
      if (data.entry) {
        setEntries(prev => prev.map(e => e.id === tempEntry.id ? data.entry : e))
      }
    } catch {
    } finally {
      setSaving(false)
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    await saveEntry()
  }

  const totalToday = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <main className="min-h-screen bg-surface max-w-lg mx-auto pb-24">
      <Toast show={visible} message={msg} />

      <div className="px-6 pt-14 pb-0">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[32px] font-semibold tracking-tight text-ink">Add entry</h1>
          {totalToday > 0 && (
            <span className="text-[13px] text-gray-400 font-mono">
              €{totalToday % 1 === 0 ? totalToday : totalToday.toFixed(2)} today
            </span>
          )}
        </div>
        <p className="text-[14px] text-gray-400 mt-0.5">Type amount + description, hit enter</p>
      </div>

      <div className="mx-5 mt-5">
        <div className={`bg-card rounded-2xl border-[1.5px] transition-all duration-200
          ${parsed ? 'border-blue shadow-[0_0_0_4px_rgba(55,138,221,0.1)]' : 'border-black/8'}`}>
          <div className="flex items-center px-5 py-4 gap-3">
            <span className="text-[20px] font-semibold text-gray-400 font-mono">€</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="done"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="50 rent"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 border-none outline-none text-[18px] bg-transparent text-ink caret-blue placeholder-gray-200"
            />
            {parsed && (
              <button
                onClick={saveEntry}
                className="w-8 h-8 rounded-full bg-blue flex items-center justify-center flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L6 11L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          {parsed && <ParseChips parsed={parsed} />}

          <div className="flex items-center justify-between px-5 py-3 border-t border-black/6">
            <span className="text-[12px] text-gray-400">Press enter to save instantly</span>
            <span className="bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5 text-[11px] font-mono text-gray-600">
              ↵ Enter
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {['50 rent', '120 fabric', '30 food', '200 ads'].map(hint => (
            <button
              key={hint}
              onClick={() => { setValue(hint); parseInputWithCustomCategories(hint, customCategories).then(setParsed); inputRef.current?.focus() }}
              className="text-[12px] text-gray-400 bg-card border border-black/6 rounded-full px-3 py-1 hover:border-blue hover:text-blue transition-all"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between px-6 mb-3">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Today</h2>
          <a href="/overview" className="text-[13px] text-blue font-medium">See all →</a>
        </div>

        {entries.length === 0 ? (
          <div className="mx-5 bg-card rounded-2xl border border-black/8 px-5 py-8 text-center">
            <p className="text-[32px] mb-2">✦</p>
            <p className="text-[14px] text-gray-400">No entries yet today</p>
            <p className="text-[12px] text-gray-300 mt-1">Try: <code className="font-mono">50 rent</code></p>
          </div>
        ) : (
          <div className="mx-5 flex flex-col gap-2">
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