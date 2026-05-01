export type MainCategory = 'Personal' | 'Business'

export type SubCategory =
  // Personal
  | 'Rent' | 'Utilities' | 'Food' | 'Leisure' | 'Transport' | 'Misc'
  // Business
  | 'Salaries' | 'Materials' | 'Tools' | 'Ads' | 'Custom'

export interface Entry {
  id: string
  user_id: string
  amount: number
  category: MainCategory
  subcategory: SubCategory | string
  note?: string
  date: string
  created_at: string
}

export interface ParsedEntry {
  amount: number
  category: MainCategory
  subcategory: string
  icon: string
  iconBg: string
  note?: string
}

export type TimeFilter = 'today' | 'week' | 'month' | 'year'
export type ModeFilter = 'combined' | 'personal' | 'business'
