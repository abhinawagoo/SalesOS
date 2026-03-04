import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import HiringClient from '@/components/hire/HiringClient'

export default async function HirePage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, name, email, role_applied, status, overall_score, created_at, assessment_token, token_expires_at')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return <HiringClient candidates={candidates || []} />
}
