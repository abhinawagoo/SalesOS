import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { userId, personaId } = await req.json()
    const supabase = createAdminClient()

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ user_id: userId, persona_id: personaId, transcript: [], scores: null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ sessionId: session.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
