from fastapi import APIRouter, HTTPException
from models import IngestRequest, IngestResponse, RetrieveRequest, RetrieveResponse
from rag import ingest_knowledge_item, retrieve_context

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest):
    try:
        item = await ingest_knowledge_item(
            org_id=req.organization_id,
            title=req.title.strip(),
            content=req.content.strip(),
            item_type=req.item_type,
            metadata=req.metadata,
        )
        return IngestResponse(item=item)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve(req: RetrieveRequest):
    try:
        context = await retrieve_context(
            query=req.query,
            org_id=req.org_id,
            limit=req.limit,
        )
        return RetrieveResponse(context=context)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
