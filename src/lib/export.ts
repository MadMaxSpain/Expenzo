import type { Entry } from '@/types'

export type ExportSort = 'category' | 'date'

// Excel in Spain expects ";" between columns and "," for decimals.
const cell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')

export function buildCsv(entries: Entry[], sort: ExportSort): string {
  const rows = [...entries]
  if (sort === 'category') {
    // Biggest categories first, then oldest to newest inside each one
    const totals: Record<string, number> = {}
    rows.forEach(e => { totals[e.subcategory] = (totals[e.subcategory] || 0) + e.amount })
    rows.sort((a, b) =>
      (totals[b.subcategory] - totals[a.subcategory]) ||
      a.subcategory.localeCompare(b.subcategory) ||
      a.date.localeCompare(b.date))
  } else {
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
  }

  const lines = ['Date;Type;Category;Note;Amount (EUR)']
  rows.forEach(e => {
    lines.push([e.date, e.category, cell(e.subcategory), cell(e.note || ''), money(e.amount)].join(';'))
  })

  // Summary underneath: one line per category, then the grand total
  const byCat: Record<string, { type: string; total: number }> = {}
  rows.forEach(e => {
    const k = `${e.category}|${e.subcategory}`
    byCat[k] = byCat[k] || { type: e.category, total: 0 }
    byCat[k].total += e.amount
  })
  lines.push('', 'SUMMARY;Type;Category;;Total (EUR)')
  Object.entries(byCat)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([k, v]) => lines.push(['', v.type, cell(k.split('|')[1]), '', money(v.total)].join(';')))
  lines.push(['TOTAL', '', '', '', money(rows.reduce((s, e) => s + e.amount, 0))].join(';'))

  return '﻿' + lines.join('\r\n')
}

export async function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const file = new File([blob], filename, { type: 'text/csv' })

  // On phones, open the share sheet (save to Files, WhatsApp, email…)
  const isPhone = typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)
  if (isPhone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
