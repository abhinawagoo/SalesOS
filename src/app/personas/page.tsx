import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import { Persona } from '@/lib/types'
import PersonaManager from '@/components/personas/PersonaManager'

export default async function PersonasPage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${user.organization_id}`)
    .order('created_at', { ascending: false })

  return (
    <PersonaManager
      personas={personas as Persona[]}
      organizationId={user.organization_id}
    />
  )
}
