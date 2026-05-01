'use client'
import { useState } from 'react'
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
  onDelete?: (id: string) => void
  onEdit?: (id: string, data: Partial<Entry>) => void
}

const CATEGORIES = ['Personal', 'Business']
const SUBCATEGORIES: Record<string, string[]> = {
  Personal: ['Rent', 'Food', 'Transport', 'Utilities', 'Leisure', 'Misc'],
  Business: ['Salaries', 'Materials', 'Ads', 'Tools', 'Rent', 'Utilities', 'Misc'],
}

export function EntryCard({ entry, animationIndex = 0, onDelete, onEdit }: EntryCardProps) {
  const { icon, bg } = getIcon(entry.subcategory)
  const isPersonal = entry.category === 'Personal'
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editAmount, setEditAmount] = useState(String(entry.amount))
  const [editCategory, setEditCategory] = useState(entry.category)
  const [editSubcategory, setEditSubcategory] = useState(entry.subcategory)
  const [editNote, setEditNote] = useState(entry.note || '')
  const [saving, setSaving] = useState(false)

  async function handleDelete() {
    if (!onDelete) return
    try {
      await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
      onDelete(entry.id)
    } catch {}
  }

  async function handleSave() {
    if (!onEdit) return
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
        onEdit(entry.id, data.entry)
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false) }}
        >
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-semibold text-ink">Edit entry</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg"
              >×</button>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Amount</label>
              <div className="flex items-center gap-2 mt-1 bg-gray-50 rounded-xl px-4 py-3 border border-black/8">
                <span className="text-gray-400 font-mono">€</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[18px] font-mono text-ink"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Category</label>
              <div className="flex gap-2 mt-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setEditCategory(cat as 'Personal' | 'Business'); setEditSubcategory(SUBCATEGORIES[cat][0]) }}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all
                      ${editCategory === cat
                        ? cat === 'Personal' ? 'bg-blue text-white border-blue' : 'bg-indigo text-white border-indigo'
                        : 'bg-gray-50 text-gray-400 border-black/8'}`}
                  >{cat}</button>
                ))}
              </div>
            </div>

            {/* Subcategory */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Subcategory</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SUBCATEGORIES[editCategory].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setEditSubcategory(sub)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
                      ${editSubcategory === sub
                        ? 'bg-blue-light text-blue-dark border-blue'
                        : 'bg-gray-50 text-gray-400 border-black/8'}`}
                  >{sub}</button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Note</label>
              <input
                type="text"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Optional note"
                className="w-full mt-1 bg-gray-50 rounded-xl px-4 py-3 border border-black/8 outline-none text-[14px] text-ink"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEdit(false); setShowDeleteConfirm(true) }}
                className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-[13px] font-medium"
              >Delete</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-blue text-white text-[14px] font-medium"
              >{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm popup */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}
        >
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-[16px] font-semibold text-ink mb-1">Delete entry?</h3>
            <p className="text-[13px] text-gray-400 mb-5">This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-black/8 text-[13px] font-medium text-gray-600"
              >Cancel</button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[13px] font-medium"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="entry-card bg-card rounded-2xl border border-black/8 px-4 py-[14px] flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        style={{ animationDelay: `${animationIndex * 40}ms` }}
        onClick={() => setShowEdit(true)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: bg }}
        >{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-ink truncate">{entry.subcategory}</div>
          <div className="text-[12px] text-gray-400 mt-[1px]">
            {entry.category}
            {entry.note && entry.note.toLowerCase() !== entry.subcategory.toLowerCase() ? ` · ${entry.note}` : ''}
            {' · '}{timeAgo(entry.created_at)}
          </div>
        </div>
        <div className={`text-[16px] font-semibold font-mono ${isPersonal ? 'text-blue-dark' : 'text-indigo-dark'}`}>
          {formatCurrency(entry.amount)}
        </div>
      </div>
    </>
  )
}