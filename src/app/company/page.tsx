import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import PlaybookClient from '@/components/company/PlaybookClient'

export default async function CompanyPage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()
  const { data: config } = await supabase
    .from('company_config')
    .select('*')
    .eq('organization_id', user.organization_id)
    .single()

  return <PlaybookClient config={config || null} />
}
