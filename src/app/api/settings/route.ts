import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', DEMO_USER.id)
    .single()

  return NextResponse.json({ user: data })
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { name } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', DEMO_USER.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ user: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
