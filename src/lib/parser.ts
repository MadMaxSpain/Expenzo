import type { ParsedEntry, MainCategory } from '@/types'

interface CategoryRule {
  category: MainCategory
  subcategory: string
  icon: string
  iconBg: string
  keywords: string[]
}

const RULES: CategoryRule[] = [
  // Personal
  { category: 'Personal', subcategory: 'Rent',      icon: '🏠', iconBg: '#E6F1FB', keywords: ['rent', 'alquiler', 'lloguer', 'hipoteca', 'mortgage'] },
  { category: 'Personal', subcategory: 'Food',       icon: '🛒', iconBg: '#E1F5EE', keywords: ['food', 'grocery', 'groceries', 'supermarket', 'mercadona', 'lidl', 'aldi', 'carrefour', 'restaurant', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'bread', 'comida', 'menjar'] },
  { category: 'Personal', subcategory: 'Transport',  icon: '🚗', iconBg: '#FAEEDA', keywords: ['transport', 'uber', 'taxi', 'bus', 'metro', 'train', 'renfe', 'fuel', 'petrol', 'gasolina', 'parking', 'car', 'tram'] },
  { category: 'Personal', subcategory: 'Utilities',  icon: '⚡', iconBg: '#F1EFE8', keywords: ['utility', 'utilities', 'electric', 'electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'luz', 'agua', 'llum'] },
  { category: 'Personal', subcategory: 'Leisure',    icon: '🎭', iconBg: '#FAECE7', keywords: ['leisure', 'cinema', 'movie', 'netflix', 'spotify', 'gym', 'sport', 'holiday', 'travel', 'hotel', 'flight', 'book', 'game', 'concert', 'bar', 'drinks'] },
  // Business
  { category: 'Business', subcategory: 'Materials',  icon: '🧵', iconBg: '#EEEDFE', keywords: ['fabric', 'tela', 'tejido', 'wood', 'madera', 'material', 'materials', 'supply', 'supplies', 'stock', 'inventory', 'thread', 'hilo', 'cotton', 'silk', 'leather'] },
  { category: 'Business', subcategory: 'Salaries',   icon: '💼', iconBg: '#EEEDFE', keywords: ['salary', 'salaries', 'wage', 'wages', 'staff', 'employee', 'payroll', 'freelance', 'contractor', 'nomina'] },
  { category: 'Business', subcategory: 'Ads',        icon: '📢', iconBg: '#FAEEDA', keywords: ['ads', 'advertising', 'marketing', 'instagram', 'facebook', 'google ads', 'campaign', 'promotion', 'publicidad'] },
  { category: 'Business', subcategory: 'Tools',      icon: '🔧', iconBg: '#E1F5EE', keywords: ['tools', 'tool', 'software', 'subscription', 'saas', 'equipment', 'machine', 'sewing', 'herramienta'] },
  { category: 'Business', subcategory: 'Utilities',  icon: '⚡', iconBg: '#F1EFE8', keywords: ['office', 'workshop', 'studio', 'taller'] },
]

export function parseInput(raw: string): ParsedEntry | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Match: optional currency symbol, number, then description
  const match = trimmed.match(/^[€£$]?\s*(\d+(?:[.,]\d{1,2})?)\s+(.+)$/)
  if (!match) return null

  const amount = parseFloat(match[1].replace(',', '.'))
  if (isNaN(amount) || amount <= 0) return null

  const desc = match[2].trim()
  const lower = desc.toLowerCase()

  // Find best matching rule
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return {
          amount,
          category: rule.category,
          subcategory: rule.subcategory,
          icon: rule.icon,
          iconBg: rule.iconBg,
          note: desc,
        }
      }
    }
  }

  // No match → create custom uncategorised entry (user can fix later)
  const capitalized = desc.charAt(0).toUpperCase() + desc.slice(1)
  return {
    amount,
    category: 'Personal',
    subcategory: capitalized,
    icon: '📌',
    iconBg: '#F1EFE8',
    note: desc,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getDateRange(filter: string): { start: string; end: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const today = fmt(now)

  if (filter === 'today') return { start: today, end: today }

  if (filter === 'week') {
    const day = now.getDay() || 7
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
    return { start: fmt(mon), end: today }
  }

  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: fmt(start), end: today }
  }

  if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1)
    return { start: fmt(start), end: today }
  }

  return { start: today, end: today }
}
