import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import { UserProfile } from '@/lib/types'
import AssignmentsClient from '@/components/assignments/AssignmentsClient'

export default async function AssignmentsPage() {
  const supabase = createAdminClient()

  const [
    { data: teamMembers },
    { data: personas },
    { data: managed },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('organization_id', DEMO_USER.organization_id),
    supabase
      .from('personas')
      .select('*')
      .order('difficulty'),
    supabase
      .from('assignments')
      .select('*, personas(title, industry, difficulty), rep:users!assignments_rep_id_fkey(name, email)')
      .eq('manager_id', DEMO_USER.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <AssignmentsClient
      teamMembers={(teamMembers || []) as UserProfile[]}
      personas={personas || []}
      managed={managed || []}
    />
  )
}
