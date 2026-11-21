'use client'
import { useEffect, useState } from 'react'
import { readCache, fetchAndCache, CATEGORIES_EVENT } from '@/lib/cache'

export interface CustomCategory { id: string; name: string; category: string; emoji: string }

let fetchedThisSession = false

// The user's own categories, shared by every screen and kept in sync:
// shows the phone's copy instantly, fetches once per app session,
// and updates whenever a category is added or deleted.
export function useCustomCategories(): CustomCategory[] {
  const [cats, setCats] = useState<CustomCategory[]>([])

  useEffect(() => {
    const sync = () => setCats(readCache<CustomCategory[]>('categories') || [])
    sync()
    window.addEventListener(CATEGORIES_EVENT, sync)
    if (!fetchedThisSession) {
      fetchedThisSession = true
      fetchAndCache<CustomCategory[]>('/api/categories', 'categories', 'categories')
    }
    return () => window.removeEventListener(CATEGORIES_EVENT, sync)
  }, [])

  return cats
}

export function findCustomCategory(cats: CustomCategory[], name: string) {
  const n = name.trim().toLowerCase()
  return cats.find(c => c.name.trim().toLowerCase() === n)
}
