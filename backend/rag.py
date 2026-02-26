import asyncio
from openai import AsyncOpenAI
from config import settings
from database import get_supabase

CHUNK_WORDS = 350
CHUNK_OVERLAP = 50

_openai: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai


# ── Chunker ───────────────────────────────────────────────────────────────────

def chunk_text(text: str) -> list[str]:
    """Paragraph-aware sliding-window chunker (mirrors src/lib/rag.ts)."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    buffer: list[str] = []

    for para in paragraphs:
        words = para.split()
        buffer.extend(words)

        while len(buffer) >= CHUNK_WORDS:
            chunks.append(" ".join(buffer[:CHUNK_WORDS]))
            buffer = buffer[CHUNK_WORDS - CHUNK_OVERLAP:]

    if len(buffer) > 20:
        chunks.append(" ".join(buffer))

    return chunks


# ── Embeddings ────────────────────────────────────────────────────────────────

async def embed_text(text: str) -> list[float]:
    client = _get_openai()
    res = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000],
    )
    return res.data[0].embedding


# ── Ingest ────────────────────────────────────────────────────────────────────

async def ingest_knowledge_item(
    org_id: str,
    title: str,
    content: str,
    item_type: str,
    metadata: dict | None = None,
) -> dict:
    supabase = get_supabase()

    # 1. Insert the raw item
    result = supabase.table("knowledge_items").insert({
        "organization_id": org_id,
        "title": title,
        "content": content,
        "item_type": item_type,
        "metadata": metadata or {},
    }).execute()

    item = result.data[0]

    # 2. Chunk + embed in batches of 10
    chunks = chunk_text(content)
    BATCH = 10

    for i in range(0, len(chunks), BATCH):
        batch = chunks[i:i + BATCH]
        embeddings = await asyncio.gather(*[embed_text(c) for c in batch])

        rows = [
            {
                "knowledge_item_id": item["id"],
                "organization_id": org_id,
                "chunk_text": batch[j],
                "chunk_index": i + j,
                "embedding": str(embeddings[j]),   # pgvector expects string repr
            }
            for j, _ in enumerate(batch)
        ]

        supabase.table("knowledge_embeddings").insert(rows).execute()

    return item


# ── Retrieve ──────────────────────────────────────────────────────────────────

async def retrieve_context(query: str, org_id: str, limit: int = 4) -> str:
    supabase = get_supabase()

    try:
        query_embedding = await embed_text(query)
    except Exception:
        return ""

    result = supabase.rpc("match_knowledge", {
        "query_embedding": str(query_embedding),
        "org_id": org_id,
        "match_count": limit,
        "match_threshold": 0.25,
    }).execute()

    if not result.data:
        return ""

    return "\n\n---\n\n".join(
        f"[{d['item_type'].upper()}: {d['title']}]\n{d['chunk_text']}"
        for d in result.data
    )
