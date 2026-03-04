import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/lib/types'
import { DEMO_USER } from '@/lib/demo'

/**
 * Returns the authenticated user's profile from the DB.
 * Falls back to DEMO_USER so the app stays functional in demo/unauthenticated mode.
 */
export async function getSessionUser(): Promise<UserProfile> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return DEMO_USER

    const { data: profile } = await supabase
      .from('users')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single()

    return (profile as UserProfile) ?? DEMO_USER
  } catch {
    return DEMO_USER
  }
}
