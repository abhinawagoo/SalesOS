import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('candidates')
    .select('id, name, email, role_applied, status, overall_score, created_at, assessment_token, token_expires_at')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ candidates: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const supabase = createAdminClient()
    const { name, email, role_applied } = await req.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name and email required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        organization_id: user.organization_id,
        invited_by: user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role_applied: role_applied?.trim() || '',
        status: 'invited',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidate: data })
  } catch (err) {
    console.error('Hiring invite error:', err)
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const supabase = createAdminClient()
    const { id, status, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (status) update.status = status
    if (notes !== undefined) update.notes = notes

    const { data, error } = await supabase
      .from('candidates')
      .update(update)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidate: data })
  } catch (err) {
    console.error('Hiring update error:', err)
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase
    .from('candidates')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  return NextResponse.json({ success: true })
}
