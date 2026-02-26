import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import KnowledgeClient from '@/components/knowledge/KnowledgeClient'

export default async function KnowledgePage() {
  const supabase = createAdminClient()

  const { data: items } = await supabase
    .from('knowledge_items')
    .select('id, title, item_type, content, created_at')
    .eq('organization_id', DEMO_USER.organization_id)
    .order('created_at', { ascending: false })

  return <KnowledgeClient items={items || []} />
}
