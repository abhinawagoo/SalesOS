import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import { Persona } from '@/lib/types'
import SimulateClient from '@/components/chat/SimulateClient'

export default async function SimulatePage() {
  const supabase = createAdminClient()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${DEMO_USER.organization_id}`)
    .order('difficulty')

  return (
    <SimulateClient
      personas={personas as Persona[]}
      userId={DEMO_USER.id}
    />
  )
}
