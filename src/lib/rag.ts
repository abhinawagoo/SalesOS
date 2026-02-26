import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'

const CHUNK_WORDS = 350
const CHUNK_OVERLAP = 50

// ── Chunker ──────────────────────────────────────────────────────────────────

export function chunkText(text: string): string[] {
  // Split on paragraph breaks first, then by word count
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let buffer: string[] = []

  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    buffer.push(...words)

    while (buffer.length >= CHUNK_WORDS) {
      chunks.push(buffer.slice(0, CHUNK_WORDS).join(' '))
      buffer = buffer.slice(CHUNK_WORDS - CHUNK_OVERLAP)
    }
  }

  if (buffer.length > 20) chunks.push(buffer.join(' '))
  return chunks
}

// ── Embeddings ───────────────────────────────────────────────────────────────

export async function embedText(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // model max
  })
  return res.data[0].embedding
}

// ── Store knowledge item + embeddings ────────────────────────────────────────

export async function ingestKnowledgeItem(params: {
  organizationId: string
  title: string
  content: string
  itemType: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createAdminClient()

  // 1. Insert the raw item
  const { data: item, error: itemError } = await supabase
    .from('knowledge_items')
    .insert({
      organization_id: params.organizationId,
      title: params.title,
      content: params.content,
      item_type: params.itemType,
      metadata: params.metadata ?? {},
    })
    .select()
    .single()

  if (itemError) throw new Error(itemError.message)

  // 2. Chunk + embed in parallel (batch of 10)
  const chunks = chunkText(params.content)
  const BATCH = 10
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const embeddings = await Promise.all(batch.map(embedText))

    const rows = embeddings.map((embedding, j) => ({
      knowledge_item_id: item.id,
      organization_id: params.organizationId,
      chunk_text: batch[j],
      chunk_index: i + j,
      embedding: JSON.stringify(embedding),
    }))

    await supabase.from('knowledge_embeddings').insert(rows)
  }

  return item
}

// ── Retrieve relevant context for a query ────────────────────────────────────

export async function retrieveContext(
  query: string,
  orgId: string,
  limit = 4
): Promise<string> {
  const supabase = createAdminClient()

  let queryEmbedding: number[]
  try {
    queryEmbedding = await embedText(query)
  } catch {
    return ''
  }

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: JSON.stringify(queryEmbedding),
    org_id: orgId,
    match_count: limit,
    match_threshold: 0.25,
  })

  if (error || !data || data.length === 0) return ''

  return data
    .map((d: { chunk_text: string; title: string; item_type: string }) =>
      `[${d.item_type.toUpperCase()}: ${d.title}]\n${d.chunk_text}`
    )
    .join('\n\n---\n\n')
}
