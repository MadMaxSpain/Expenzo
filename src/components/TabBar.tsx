'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function TabBar() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 tab-glass border-t border-black/8 h-[83px] flex items-start pt-2 justify-around max-w-lg mx-auto">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 px-8 py-1.5 rounded-xl transition-all
          ${path === '/' ? 'text-blue' : 'text-gray-400'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
        </svg>
        <span className="text-[10px] font-medium tracking-wide">Add</span>
      </Link>

      <Link
        href="/overview"
        className={`flex flex-col items-center gap-1 px-8 py-1.5 rounded-xl transition-all
          ${path === '/overview' ? 'text-blue' : 'text-gray-400'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span className="text-[10px] font-medium tracking-wide">Overview</span>
      </Link>
    </nav>
  )
}
