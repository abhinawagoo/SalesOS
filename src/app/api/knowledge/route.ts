import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import { callPython } from '@/lib/python-backend'

export async function GET() {
  const user = await getSessionUser()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('knowledge_items')
    .select('id, title, item_type, created_at, content')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const { title, content, item_type } = await req.json()

    if (!title?.trim() || !content?.trim() || !item_type) {
      return NextResponse.json({ error: 'title, content, and item_type required' }, { status: 400 })
    }

    const data = await callPython<{ item: unknown }>('/rag/ingest', {
      organization_id: user.organization_id,
      title: title.trim(),
      content: content.trim(),
      item_type,
    })

    return NextResponse.json({ item: data.item })
  } catch (err) {
    console.error('Knowledge ingest error:', err)
    return NextResponse.json({ error: 'Failed to ingest knowledge item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase
    .from('knowledge_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organization_id)

  return NextResponse.json({ success: true })
}
