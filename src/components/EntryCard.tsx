'use client'
import { useState, useRef } from 'react'
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

const CATEGORIES = ['Personal', 'Business']
const SUBCATEGORIES: Record<string, string[]> = {
  Personal: ['Rent', 'Food', 'Transport', 'Utilities', 'Leisure', 'Misc'],
  Business: ['Salaries', 'Materials', 'Ads', 'Tools', 'Rent', 'Utilities', 'Misc'],
}

interface EntryCardProps {
  entry: Entry
  animationIndex?: number
  onDelete?: (id: string) => void
  onEdit?: (id: string, data: Partial<Entry>) => void
}

export function EntryCard({ entry, animationIndex = 0, onDelete, onEdit }: EntryCardProps) {
  const { icon, bg } = getIcon(entry.subcategory)
  const isPersonal = entry.category === 'Personal'

  // Swipe state
  const [translateX, setTranslateX] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)
  const SWIPE_THRESHOLD = 60
  const ACTION_WIDTH = 144 // two buttons × 72px

  // Edit popup state
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editAmount, setEditAmount] = useState(String(entry.amount))
  const [editCategory, setEditCategory] = useState(entry.category)
  const [editSubcategory, setEditSubcategory] = useState(entry.subcategory)
  const [editNote, setEditNote] = useState(entry.note || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Touch handlers
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Only hijack horizontal swipes
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return
    isDragging.current = true

    if (dx > 0 && !swiped) return // no right swipe
    const base = swiped ? -ACTION_WIDTH : 0
    const next = Math.max(-(ACTION_WIDTH + 20), Math.min(0, base + dx))
    setTranslateX(next)
  }

  function onTouchEnd() {
    if (!isDragging.current) return
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-ACTION_WIDTH)
      setSwiped(true)
    } else {
      setTranslateX(0)
      setSwiped(false)
    }
  }

  function closeSwipe() {
    setTranslateX(0)
    setSwiped(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
      onDelete?.(entry.id)
    } catch {
      setDeleting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          category: editCategory,
          subcategory: editSubcategory,
          note: editNote,
        }),
      })
      const data = await res.json()
      if (data.entry) {
        onEdit?.(entry.id, data.entry)
        setShowEdit(false)
      }
    } catch {} finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Edit popup */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false) }}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-semibold text-ink">Edit entry</h3>
              <button onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl leading-none">
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Amount</label>
              <div className="flex items-center gap-2 mt-1.5 bg-gray-50 rounded-xl px-4 py-3 border border-black/8">
                <span className="text-gray-400 font-mono text-lg">€</span>
                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[20px] font-mono text-ink" />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Type</label>
              <div className="flex gap-2 mt-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => { setEditCategory(cat as 'Personal' | 'Business'); setEditSubcategory(SUBCATEGORIES[cat][0]) }}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all
                      ${editCategory === cat
                        ? cat === 'Personal' ? 'bg-blue text-white border-blue' : 'bg-[#534AB7] text-white border-[#534AB7]'
                        : 'bg-gray-50 text-gray-400 border-black/8'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {SUBCATEGORIES[editCategory].map(sub => (
                  <button key={sub} onClick={() => setEditSubcategory(sub)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
                      ${editSubcategory === sub
                        ? 'bg-blue-light text-blue-dark border-blue'
                        : 'bg-gray-50 text-gray-400 border-black/8'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Note</label>
              <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)}
                placeholder="Optional note"
                className="w-full mt-1.5 bg-gray-50 rounded-xl px-4 py-3 border border-black/8 outline-none text-[14px] text-ink" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowEdit(false); setShowDeleteConfirm(true) }}
                className="px-4 py-3 rounded-xl border border-red-200 text-red-400 text-[13px] font-medium">
                Delete
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue text-white text-[14px] font-medium active:scale-[0.98] transition-transform">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-[16px] font-semibold text-ink mb-1">Delete entry?</h3>
            <p className="text-[13px] text-gray-400 mb-5">This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-black/8 text-[13px] font-medium text-gray-600">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[13px] font-medium">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swipe container */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ animationDelay: `${animationIndex * 40}ms` }}>

        {/* Action buttons behind the card */}
        <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
          {/* Edit button */}
          <button
            onClick={() => { closeSwipe(); setShowEdit(true) }}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-opacity"
            style={{ background: '#378ADD' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13 2.5L15.5 5L6 14.5H3.5V12L13 2.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px] font-medium">Edit</span>
          </button>

          {/* Delete button */}
          <button
            onClick={() => { closeSwipe(); setShowDeleteConfirm(true) }}
            className="flex-1 flex flex-col items-center justify-center gap-1"
            style={{ background: '#FF3B30' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5H15M7 5V3H11V5M6 5V14C6 14.6 6.4 15 7 15H11C11.6 15 12 14.6 12 14V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white text-[11px] font-medium">Delete</span>
          </button>
        </div>

        {/* Card — slides left to reveal buttons */}
        <div
          className="relative bg-card border border-black/8 rounded-2xl px-4 py-[14px] flex items-center gap-3 entry-card"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            willChange: 'transform',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => {
            if (swiped) { closeSwipe(); return }
            setShowEdit(true)
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: bg }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-ink truncate">{entry.subcategory}</div>
            <div className="text-[12px] text-gray-400 mt-[1px]">
              {entry.category}
              {entry.note && entry.note.toLowerCase() !== entry.subcategory.toLowerCase()
                ? ` · ${entry.note}` : ''}
              {' · '}{timeAgo(entry.created_at)}
            </div>
          </div>
          <div className={`text-[16px] font-semibold font-mono flex-shrink-0 ${isPersonal ? 'text-blue-dark' : 'text-[#3C3489]'}`}>
            {formatCurrency(entry.amount)}
          </div>
        </div>
      </div>
    </>
  )
}