import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import { Persona } from '@/lib/types'
import PersonaManager from '@/components/personas/PersonaManager'

export default async function PersonasPage() {
  const supabase = createAdminClient()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${DEMO_USER.organization_id}`)
    .order('created_at', { ascending: false })

  return (
    <PersonaManager
      personas={personas as Persona[]}
      organizationId={DEMO_USER.organization_id}
    />
  )
}
