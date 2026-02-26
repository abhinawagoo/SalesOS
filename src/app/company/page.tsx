import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import PlaybookClient from '@/components/company/PlaybookClient'

export default async function CompanyPage() {
  const supabase = createAdminClient()
  const { data: config } = await supabase
    .from('company_config')
    .select('*')
    .eq('organization_id', DEMO_USER.organization_id)
    .single()

  return <PlaybookClient config={config || null} />
}
