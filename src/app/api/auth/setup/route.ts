import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId, name, email, role, orgName } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Idempotent — if profile already exists (trigger ran), just return it
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, organization_id, role')
      .eq('id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, orgId: existing.organization_id, existing: true })
    }

    // Create org (use orgName or fallback to a sensible default)
    const resolvedOrgName = orgName?.trim() || `${name?.trim() || email.split('@')[0]}'s Workspace`

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({ name: resolvedOrgName })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // Create user profile
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name: name?.trim() || email.split('@')[0],
        email,
        role: role || 'rep',
        organization_id: org.id,
      })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orgId: org.id })
  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
