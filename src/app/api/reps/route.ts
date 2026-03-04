import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('organization_id', user.organization_id)
      .eq('role', 'rep')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reps: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reps' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const supabase = createAdminClient()
    const { name, email } = await req.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    // Step 1: Create auth user (satisfies users.id FK constraint).
    // email_confirm: true so no confirmation email is sent.
    // The DB trigger will fire and create a users row + orphan org.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        role: 'rep',
        org_name: 'pending', // placeholder — will be overwritten below
      },
    })

    if (authError) {
      // "already exists" comes back as a 422 from Supabase
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exist')) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const authUserId = authData.user.id

    // Step 2: The trigger created a users row pointing to an orphan org.
    // Patch it to point to the manager's org and set role correctly.
    const { data: rep, error: updateError } = await supabase
      .from('users')
      .update({
        organization_id: user.organization_id,
        role: 'rep',
        name: cleanName,
      })
      .eq('id', authUserId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ rep })
  } catch {
    return NextResponse.json({ error: 'Failed to create rep' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const supabase = createAdminClient()
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Remove from users table (FK cascade or soft delete)
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .eq('role', 'rep')

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Also remove the auth user so they can't log in
    await supabase.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove rep' }, { status: 500 })
  }
}
