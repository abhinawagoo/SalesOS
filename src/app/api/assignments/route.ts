import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Manager: see assignments they created
    const { data: managed } = await supabase
      .from('assignments')
      .select('*, personas(title, industry, difficulty), rep:users!assignments_rep_id_fkey(name, email)')
      .eq('manager_id', DEMO_USER.id)
      .order('created_at', { ascending: false })

    // Rep: see assignments for them
    const { data: assigned } = await supabase
      .from('assignments')
      .select('*, personas(title, industry, difficulty), sessions(scores, created_at)')
      .eq('rep_id', DEMO_USER.id)
      .order('due_date', { ascending: true })

    return NextResponse.json({ managed: managed || [], assigned: assigned || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    const { rep_id, persona_id, scenario_type, due_date } = body

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        manager_id: DEMO_USER.id,
        rep_id,
        persona_id,
        scenario_type,
        due_date: due_date || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ assignment: data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { id, status, manager_comment, session_id } = await req.json()

    const { error } = await supabase
      .from('assignments')
      .update({ status, manager_comment, session_id })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}
