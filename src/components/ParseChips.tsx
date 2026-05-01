import type { ParsedEntry } from '@/types'

interface ParseChipsProps {
  parsed: ParsedEntry | null
}

export function ParseChips({ parsed }: ParseChipsProps) {
  if (!parsed) return null

  const isPersonal = parsed.category === 'Personal'

  return (
    <div className="flex flex-wrap gap-2 px-5 pb-4">
      <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-teal-light text-[#0F6E56]">
        €{parsed.amount % 1 === 0 ? parsed.amount : parsed.amount.toFixed(2)}
      </span>
      <span className={`px-3 py-1 rounded-full text-[12px] font-medium
        ${isPersonal ? 'bg-coral-light text-[#993C1D]' : 'bg-amber-light text-[#633806]'}`}>
        {parsed.category}
      </span>
      <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-blue-light text-blue-dark">
        {parsed.subcategory}
      </span>
    </div>
  )
}
