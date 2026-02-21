import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Persona } from '@/lib/types'
import SimulateClient from '@/components/chat/SimulateClient'

export default async function SimulatePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${userProfile?.organization_id}`)
    .order('difficulty')

  return (
    <SimulateClient
      personas={personas as Persona[]}
      userId={user.id}
    />
  )
}
