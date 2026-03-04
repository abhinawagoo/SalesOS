import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import KnowledgeClient from '@/components/knowledge/KnowledgeClient'

export default async function KnowledgePage() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const { data: items } = await supabase
    .from('knowledge_items')
    .select('id, title, item_type, content, created_at')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })

  return <KnowledgeClient items={items || []} />
}
