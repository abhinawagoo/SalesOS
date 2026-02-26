from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, field_validator


# ── Persona ───────────────────────────────────────────────────────────────────

class Persona(BaseModel):
    id: str
    title: str
    industry: str
    buyer_role: str
    difficulty: Literal["easy", "medium", "hard"]
    personality_traits: list[str]
    objection_style: str
    organization_id: Optional[str] = None


# ── Message ───────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["system", "assistant", "user"]
    content: str


# ── Scoring ───────────────────────────────────────────────────────────────────

class SubSkillScore(BaseModel):
    score: float
    explanation: str
    evidence: str = "No clear evidence"

    @field_validator("score", mode="before")
    @classmethod
    def clamp(cls, v: float) -> float:
        return max(1.0, min(10.0, float(v)))


class CategoryScore(BaseModel):
    score: float
    sub_skills: dict[str, SubSkillScore]

    @field_validator("score", mode="before")
    @classmethod
    def clamp(cls, v: float) -> float:
        return max(1.0, min(10.0, float(v)))


class CoachingItem(BaseModel):
    behavior: str
    evidence: str = "No clear evidence"


class TopPerformerRewrite(BaseModel):
    original: str
    improved: str
    context: str = "During the conversation"


class SessionCoaching(BaseModel):
    strengths: list[CoachingItem]
    weaknesses: list[CoachingItem]
    top_performer_rewrites: list[TopPerformerRewrite]
    focus_recommendation: str


class DiscoverySubSkills(BaseModel):
    problem_depth: SubSkillScore
    quantification: SubSkillScore
    stakeholder_identification: SubSkillScore


class ObjectionSubSkills(BaseModel):
    acknowledgement: SubSkillScore
    reframing: SubSkillScore
    confidence_control: SubSkillScore


class ValueSubSkills(BaseModel):
    roi_clarity: SubSkillScore
    differentiation: SubSkillScore
    use_case_relevance: SubSkillScore


class ClosingSubSkills(BaseModel):
    clear_next_step: SubSkillScore
    timeline_alignment: SubSkillScore
    commitment_securing: SubSkillScore


class ScoreCategories(BaseModel):
    discovery: CategoryScore
    objection_handling: CategoryScore
    value_articulation: CategoryScore
    closing: CategoryScore


class SessionScore(BaseModel):
    overall_score: float
    categories: ScoreCategories
    coaching: SessionCoaching

    @field_validator("overall_score", mode="before")
    @classmethod
    def clamp(cls, v: float) -> float:
        return max(1.0, min(10.0, float(v)))


# ── Knowledge Base ────────────────────────────────────────────────────────────

class KnowledgeItem(BaseModel):
    id: str
    organization_id: str
    title: str
    content: str
    item_type: str
    metadata: dict = {}
    created_at: str


# ── Request / Response bodies ─────────────────────────────────────────────────

class IngestRequest(BaseModel):
    organization_id: str
    title: str
    content: str
    item_type: str
    metadata: dict = {}


class IngestResponse(BaseModel):
    item: dict


class RetrieveRequest(BaseModel):
    query: str
    org_id: str
    limit: int = 4


class RetrieveResponse(BaseModel):
    context: str


class ScoreRequest(BaseModel):
    sessionId: str
    messages: list[Message]
    persona: Persona
    scenarioType: Literal["cold_outbound", "discovery", "objection_handling", "closing"]


class ScoreResponse(BaseModel):
    score: dict
