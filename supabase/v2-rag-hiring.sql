-- ============================================================
-- SalesOS v2 — RAG Knowledge Layer + Company Config + Hiring
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Knowledge items (raw documents)
CREATE TABLE IF NOT EXISTS knowledge_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  item_type        TEXT NOT NULL CHECK (item_type IN (
                     'transcript', 'product_doc', 'objection',
                     'battlecard', 'pricing', 'case_study', 'playbook')),
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chunked embeddings
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id   UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  chunk_text          TEXT NOT NULL,
  chunk_index         INT  DEFAULT 0,
  embedding           vector(1536),   -- text-embedding-3-small dimensions
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index (fast cosine similarity search)
CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx
  ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Semantic search function
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding  vector(1536),
  org_id           UUID,
  match_count      INT   DEFAULT 5,
  match_threshold  FLOAT DEFAULT 0.25
)
RETURNS TABLE (
  chunk_text  TEXT,
  title       TEXT,
  item_type   TEXT,
  similarity  FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    ke.chunk_text,
    ki.title,
    ki.item_type,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  JOIN knowledge_items ki ON ki.id = ke.knowledge_item_id
  WHERE ki.organization_id = org_id
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 5. Company playbook / configuration
CREATE TABLE IF NOT EXISTS company_config (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  icp_description      TEXT    DEFAULT '',
  must_ask_questions   TEXT[]  DEFAULT '{}',
  key_differentiators  TEXT[]  DEFAULT '{}',
  forbidden_phrases    TEXT[]  DEFAULT '{}',
  scoring_focus        TEXT[]  DEFAULT '{}',
  competitor_names     TEXT[]  DEFAULT '{}',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Hiring candidates (separate from users — no auth account needed)
CREATE TABLE IF NOT EXISTS candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by       UUID REFERENCES users(id),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  role_applied     TEXT DEFAULT '',
  status           TEXT DEFAULT 'invited' CHECK (
                     status IN ('invited','in_progress','completed','hired','rejected')),
  assessment_token UUID DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  overall_score    FLOAT,
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Candidate simulation sessions (isolated from rep sessions)
CREATE TABLE IF NOT EXISTS candidate_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID REFERENCES candidates(id) ON DELETE CASCADE,
  persona_id    UUID REFERENCES personas(id),
  scenario_type TEXT,
  transcript    JSONB DEFAULT '[]',
  scores        JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
