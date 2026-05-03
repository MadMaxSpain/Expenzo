'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TabBar } from '@/components/TabBar'

const DEFAULT_CATEGORIES = [
  { name: 'Rent',      category: 'Personal', emoji: '🏠' },
  { name: 'Food',      category: 'Personal', emoji: '🛒' },
  { name: 'Transport', category: 'Personal', emoji: '🚗' },
  { name: 'Utilities', category: 'Personal', emoji: '⚡' },
  { name: 'Leisure',   category: 'Personal', emoji: '🎭' },
  { name: 'Misc',      category: 'Personal', emoji: '📌' },
  { name: 'Salaries',  category: 'Business', emoji: '💼' },
  { name: 'Materials', category: 'Business', emoji: '🧵' },
  { name: 'Ads',       category: 'Business', emoji: '📢' },
  { name: 'Tools',     category: 'Business', emoji: '🔧' },
]

const EMOJI_OPTIONS = [
  '📌','💰','🏠','🚗','✈️','🍔','☕','🛒','⚡','💊','🎭','🎮','📱','💻','🖥️',
  '📚','🎓','👕','👟','💄','🏋️','🎵','🎬','🐕','🌿','🏖️','🎁','💼','🧵','🪵',
  '🔧','📢','🖨️','📦','🏭','🤝','📊','💳','🔑','🏗️','⚙️','🧪','🎨','✂️','🧹',
]

interface CustomCategory {
  id: string
  name: string
  category: string
  emoji: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'Personal' | 'Business'>('Personal')
  const [newEmoji, setNewEmoji] = useState('📌')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.categories) setCustomCategories(data.categories)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), category: newType, emoji: newEmoji }),
      })
      const data = await res.json()
      if (data.category) {
        setCustomCategories(prev => [...prev, data.category])
        setNewName('')
        setNewEmoji('📌')
        setShowAdd(false)
      }
    } catch {} finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      setCustomCategories(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  const personalCustom = customCategories.filter(c => c.category === 'Personal')
  const businessCustom = customCategories.filter(c => c.category === 'Business')

  return (
    <main className="min-h-screen bg-surface max-w-lg mx-auto pb-24">

      {/* Add category popup */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-semibold text-ink">New category</h3>
              <button onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl">×</button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Haircut, Coffee, Packaging"
                className="w-full mt-1.5 bg-gray-50 rounded-xl px-4 py-3 border border-black/8 outline-none text-[14px] text-ink"
              />
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Type</label>
              <div className="flex gap-2 mt-1.5">
                {(['Personal', 'Business'] as const).map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all
                      ${newType === t
                        ? t === 'Personal' ? 'bg-blue text-white border-blue' : 'bg-[#534AB7] text-white border-[#534AB7]'
                        : 'bg-gray-50 text-gray-400 border-black/8'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji picker */}
            <div className="mb-6">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Icon</label>
              <div className="flex flex-wrap gap-2 mt-1.5 max-h-32 overflow-y-auto">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all
                      ${newEmoji === e ? 'border-blue bg-blue-light' : 'border-black/8 bg-gray-50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 mb-5 border border-black/8">
              <div className="w-10 h-10 rounded-xl bg-blue-light flex items-center justify-center text-xl">{newEmoji}</div>
              <div>
                <div className="text-[14px] font-medium text-ink">{newName || 'Category name'}</div>
                <div className="text-[12px] text-gray-400">{newType}</div>
              </div>
            </div>

            <button onClick={handleAdd} disabled={saving || !newName.trim()}
              className="w-full py-3 rounded-xl bg-blue text-white text-[14px] font-medium disabled:opacity-40">
              {saving ? 'Saving…' : 'Add category'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-14 pb-0 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink flex-1">Categories</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full bg-blue flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Default categories */}
      <div className="mx-5 mt-6">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Default</p>
        <div className="bg-card rounded-2xl border border-black/8 overflow-hidden">
          {DEFAULT_CATEGORIES.map((cat, i) => (
            <div key={cat.name}
              className={`flex items-center gap-3 px-4 py-3 ${i < DEFAULT_CATEGORIES.length - 1 ? 'border-b border-black/6' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">{cat.emoji}</div>
              <div className="flex-1">
                <span className="text-[14px] font-medium text-ink">{cat.name}</span>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                ${cat.category === 'Personal' ? 'bg-blue-light text-blue-dark' : 'bg-indigo-light text-indigo-dark'}`}>
                {cat.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div className="mx-5 mt-6">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Your categories</p>

        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">Loading…</div>
        ) : customCategories.length === 0 ? (
          <div className="bg-card rounded-2xl border border-black/8 px-5 py-8 text-center">
            <p className="text-[28px] mb-2">✦</p>
            <p className="text-[14px] text-gray-400">No custom categories yet</p>
            <p className="text-[12px] text-gray-300 mt-1">Tap + to create your first one</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-black/8 overflow-hidden">
            {customCategories.map((cat, i) => (
              <div key={cat.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < customCategories.length - 1 ? 'border-b border-black/6' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-blue-light flex items-center justify-center text-base">{cat.emoji}</div>
                <div className="flex-1">
                  <span className="text-[14px] font-medium text-ink">{cat.name}</span>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mr-2
                  ${cat.category === 'Personal' ? 'bg-blue-light text-blue-dark' : 'bg-indigo-light text-indigo-dark'}`}>
                  {cat.category}
                </span>
                <button onClick={() => handleDelete(cat.id)}
                  className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3H10M4 3V2H8V3M3.5 3V9.5C3.5 9.8 3.7 10 4 10H8C8.3 10 8.5 9.8 8.5 9.5V3" stroke="#FF3B30" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </main>
  )
}