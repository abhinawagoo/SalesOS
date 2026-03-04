import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import { Session, UserProfile } from '@/lib/types'
import TeamClient from '@/components/team/TeamClient'

export default async function TeamPage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const [{ data: reps }, { data: sessions }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('role', 'rep')
      .order('created_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('user_id, scores, created_at')
      .eq('user_id', user.id), // in demo, only DEMO_USER has sessions
  ])

  // Build per-rep stats from sessions
  const sessionsByRep: Record<string, Session[]> = {}
  for (const s of (sessions || []) as Session[]) {
    if (!sessionsByRep[s.user_id]) sessionsByRep[s.user_id] = []
    sessionsByRep[s.user_id].push(s)
  }

  return (
    <TeamClient
      reps={(reps || []) as UserProfile[]}
      sessionsByRep={sessionsByRep}
    />
  )
}
