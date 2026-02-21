import { createClient } from '@/lib/supabase/server'
import { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'
import PersonaManager from '@/components/personas/PersonaManager'

export default async function PersonasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${profile?.organization_id}`)
    .order('created_at', { ascending: false })

  return (
    <PersonaManager
      personas={personas as Persona[]}
      organizationId={profile?.organization_id}
    />
  )
}
