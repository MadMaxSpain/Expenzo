// Tiny on-device cache so screens show the last known data instantly,
// then refresh quietly in the background.

const PREFIX = 'expenzo:'

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// Fired whenever the user's categories change, so every screen updates its icons
export const CATEGORIES_EVENT = 'expenzo:categories'

export function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    if (key === 'categories') window.dispatchEvent(new Event(CATEGORIES_EVENT))
  } catch {}
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

// Fetch JSON and store the chosen field in the cache. Returns null on failure.
export async function fetchAndCache<T>(url: string, field: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data[field] === undefined) return null
    writeCache(key, data[field])
    return data[field] as T
  } catch {
    return null
  }
}

// The key includes the current day/month/year so stale periods are never shown
// (e.g. yesterday's entries won't appear under "Today").
export function entriesKey(time: string, mode: string) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const stamp =
    time === 'today' ? `${y}-${m}-${d}` :
    time === 'week' ? `${y}-${m}-${d - ((now.getDay() + 6) % 7)}` :
    time === 'month' ? `${y}-${m}` :
    `${y}`
  return `entries:${time}:${mode}:${stamp}`
}
