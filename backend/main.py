import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.health import router as health_router
from routers.rag import router as rag_router
from routers.score import router as score_router

app = FastAPI(title="SalesOS AI Engine", version="1.0.0")

# Allow all origins in dev; lock to Vercel domain in prod via ALLOWED_ORIGINS env var
_raw = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in _raw.split(",")] if _raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(rag_router, prefix="/rag", tags=["rag"])
app.include_router(score_router, tags=["score"])
