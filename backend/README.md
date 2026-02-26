# SalesOS AI Engine — Python Microservice

FastAPI microservice handling RAG ingestion/retrieval and AI scoring.

## Why Python?

| Capability | Python advantage |
|---|---|
| RAG pipeline | LangChain/LlamaIndex text splitters, pgvector |
| Scoring | Pydantic strict validation, multi-step prompting |
| Future | LangGraph, batch analysis, fine-tuning |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/rag/ingest` | Chunk + embed + store knowledge item |
| POST | `/rag/retrieve` | Embed query → pgvector match → formatted context |
| POST | `/score` | Score transcript with GPT-4o + Pydantic validation |

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
uvicorn main:app --reload
```

Open http://localhost:8000/docs for interactive API docs.

## Request examples

```bash
# Health
curl http://localhost:8000/health

# Ingest a knowledge item
curl -X POST http://localhost:8000/rag/ingest \
  -H 'Content-Type: application/json' \
  -d '{"organization_id":"<org>","title":"Pricing FAQ","content":"...","item_type":"faq"}'

# Retrieve context
curl -X POST http://localhost:8000/rag/retrieve \
  -H 'Content-Type: application/json' \
  -d '{"query":"how does pricing work","org_id":"<org>"}'

# Score a session
curl -X POST http://localhost:8000/score \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"<id>","messages":[...],"persona":{...},"scenarioType":"discovery"}'
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | GPT-4o + embeddings |
| `SUPABASE_URL` | Yes | Same as Next.js `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin access (bypasses RLS) |
| `DEMO_ORG_ID` | No | Default org for company_config lookup |
