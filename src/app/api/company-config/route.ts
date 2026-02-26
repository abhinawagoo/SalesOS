import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('company_config')
    .select('*')
    .eq('organization_id', DEMO_USER.organization_id)
    .single()

  return NextResponse.json({ config: data || null })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    const {
      icp_description,
      must_ask_questions,
      key_differentiators,
      forbidden_phrases,
      scoring_focus,
      competitor_names,
    } = body

    const { data, error } = await supabase
      .from('company_config')
      .upsert({
        organization_id: DEMO_USER.organization_id,
        icp_description: icp_description ?? '',
        must_ask_questions: must_ask_questions ?? [],
        key_differentiators: key_differentiators ?? [],
        forbidden_phrases: forbidden_phrases ?? [],
        scoring_focus: scoring_focus ?? [],
        competitor_names: competitor_names ?? [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ config: data })
  } catch (err) {
    console.error('Company config error:', err)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}
