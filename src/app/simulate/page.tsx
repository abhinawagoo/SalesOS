import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import { Persona } from '@/lib/types'
import SimulateClient from '@/components/chat/SimulateClient'

export default async function SimulatePage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${user.organization_id}`)
    .order('difficulty')

  return (
    <SimulateClient
      personas={personas as Persona[]}
      userId={user.id}
    />
  )
}
