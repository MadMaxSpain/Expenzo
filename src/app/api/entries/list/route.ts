import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDateRange } from '@/lib/parser'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const timeFilter = searchParams.get('time') || 'month'
  const modeFilter = searchParams.get('mode') || 'combined'

  // Explicit from/to (YYYY-MM-DD) wins over the preset time filter
  const isDate = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const { start, end } = isDate(fromParam) && isDate(toParam)
    ? { start: fromParam as string, end: toParam as string }
    : getDateRange(timeFilter)

  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('created_at', { ascending: false })

  if (modeFilter === 'personal') query = query.eq('category', 'Personal')
  if (modeFilter === 'business') query = query.eq('category', 'Business')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}
