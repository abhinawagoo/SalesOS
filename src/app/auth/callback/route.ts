import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If a specific next URL was requested, honour it
      if (next) return NextResponse.redirect(`${origin}${next}`)

      // Otherwise redirect by role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        const destination = profile?.role === 'manager' ? '/dashboard/manager' : '/dashboard/rep'
        return NextResponse.redirect(`${origin}${destination}`)
      }

      return NextResponse.redirect(`${origin}/dashboard/rep`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=1`)
}
