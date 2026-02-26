import json
from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import ValidationError

from config import settings
from database import get_supabase
from models import ScoreRequest, ScoreResponse, SessionScore

router = APIRouter()

_openai: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai


# ─── Scoring System Prompt ────────────────────────────────────────────────────

SCORING_SYSTEM = """You are an expert enterprise sales coach. Analyze the SALES REP's performance only (not the buyer).

Return ONLY a single JSON object matching EXACTLY this structure — no markdown, no code fences, no extra keys:

{
  "overall_score": <number 1-10, 1 decimal>,
  "categories": {
    "discovery": {
      "score": <number 1-10, 1 decimal>,
      "sub_skills": {
        "problem_depth":            { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "quantification":           { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "stakeholder_identification":{ "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" }
      }
    },
    "objection_handling": {
      "score": <number 1-10, 1 decimal>,
      "sub_skills": {
        "acknowledgement":    { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "reframing":          { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "confidence_control": { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" }
      }
    },
    "value_articulation": {
      "score": <number 1-10, 1 decimal>,
      "sub_skills": {
        "roi_clarity":        { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "differentiation":    { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "use_case_relevance": { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" }
      }
    },
    "closing": {
      "score": <number 1-10, 1 decimal>,
      "sub_skills": {
        "clear_next_step":      { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "timeline_alignment":   { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" },
        "commitment_securing":  { "score": <1-10>, "explanation": "<1-2 sentences>", "evidence": "<exact rep quote or 'No clear evidence'>" }
      }
    }
  },
  "coaching": {
    "strengths": [
      { "behavior": "<what rep did well>", "evidence": "<exact rep quote>" },
      { "behavior": "<what rep did well>", "evidence": "<exact rep quote>" },
      { "behavior": "<what rep did well>", "evidence": "<exact rep quote>" }
    ],
    "weaknesses": [
      { "behavior": "<what to improve>", "evidence": "<exact rep quote>" },
      { "behavior": "<what to improve>", "evidence": "<exact rep quote>" },
      { "behavior": "<what to improve>", "evidence": "<exact rep quote>" }
    ],
    "top_performer_rewrites": [
      { "context": "<situation description>", "original": "<what rep said>", "improved": "<what top performer would say>" },
      { "context": "<situation description>", "original": "<what rep said>", "improved": "<what top performer would say>" }
    ],
    "focus_recommendation": "<one specific sentence on what to work on next>"
  }
}

Scoring criteria:
- discovery.problem_depth: Did they uncover deep pain, root causes, and business impact?
- discovery.quantification: Did they quantify the problem in business terms (revenue, cost, time)?
- discovery.stakeholder_identification: Did they identify decision makers and influencers?
- objection_handling.acknowledgement: Did they empathetically acknowledge objections before responding?
- objection_handling.reframing: Did they reframe objections into value opportunities?
- objection_handling.confidence_control: Did they stay in control and confident under pressure?
- value_articulation.roi_clarity: Did they present specific ROI tied to this buyer's situation?
- value_articulation.differentiation: Did they differentiate from alternatives/status quo concretely?
- value_articulation.use_case_relevance: Did they map the solution to this buyer's exact use case?
- closing.clear_next_step: Did they propose a specific, concrete next step?
- closing.timeline_alignment: Did they understand and work with the buyer's timeline?
- closing.commitment_securing: Did they get any form of commitment or micro-agreement?

Category score = average of its 3 sub-skills rounded to 1 decimal.
Overall score = average of 4 category scores rounded to 1 decimal."""


# ─── Normalizer (handles GPT key-casing drift) ────────────────────────────────

def normalize_score(raw: dict) -> dict:
    # If categories is missing, model may have returned top-level UPPERCASE keys
    if "categories" not in raw:
        key_map = {
            "DISCOVERY": "discovery",
            "OBJECTION_HANDLING": "objection_handling",
            "VALUE_ARTICULATION": "value_articulation",
            "CLOSING": "closing",
        }
        cats: dict = {}
        for upper, lower in key_map.items():
            if upper in raw:
                cats[lower] = raw.pop(upper)
        if cats:
            raw["categories"] = cats

    # Normalize coaching arrays
    coaching = raw.get("coaching", {})
    if isinstance(coaching, dict):
        for field in ("strengths", "weaknesses"):
            items = coaching.get(field, [])
            if isinstance(items, list):
                coaching[field] = [
                    {"behavior": item, "evidence": "No clear evidence"}
                    if isinstance(item, str)
                    else item
                    for item in items
                ]

        rewrites = coaching.get("top_performer_rewrites", [])
        if isinstance(rewrites, list):
            coaching["top_performer_rewrites"] = [
                {**r, "context": r.get("context", "During the conversation")}
                if isinstance(r, dict)
                else r
                for r in rewrites
            ]

    return raw


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/score", response_model=ScoreResponse)
async def score_session(req: ScoreRequest):
    supabase = get_supabase()
    client = _get_openai()

    rep_messages = [m for m in req.messages if m.role == "user"]
    if not rep_messages:
        raise HTTPException(status_code=400, detail="No rep messages to score")

    # Fetch company config for org-specific scoring context
    config_result = (
        supabase.table("company_config")
        .select("must_ask_questions,key_differentiators,forbidden_phrases,competitor_names,scoring_focus")
        .eq("organization_id", settings.DEMO_ORG_ID)
        .execute()
    )
    company_config = config_result.data[0] if config_result.data else None

    company_context_parts: list[str] = []
    if company_config:
        if company_config.get("must_ask_questions"):
            company_context_parts.append(
                f"- Must-ask questions (deduct discovery score if skipped): {'; '.join(company_config['must_ask_questions'])}"
            )
        if company_config.get("key_differentiators"):
            company_context_parts.append(
                f"- Key differentiators rep should mention: {'; '.join(company_config['key_differentiators'])}"
            )
        if company_config.get("forbidden_phrases"):
            company_context_parts.append(
                f"- Forbidden phrases (flag as weakness if used): {', '.join(company_config['forbidden_phrases'])}"
            )
        if company_config.get("competitor_names"):
            company_context_parts.append(
                f"- Competitors to watch for in objections: {', '.join(company_config['competitor_names'])}"
            )
        if company_config.get("scoring_focus"):
            company_context_parts.append(
                f"- Extra scoring criteria: {'; '.join(company_config['scoring_focus'])}"
            )

    company_context = (
        "COMPANY-SPECIFIC SCORING RULES:\n" + "\n".join(company_context_parts)
        if company_context_parts
        else ""
    )

    transcript_text = "\n\n".join(
        f"{'SALES REP' if m.role == 'user' else f'BUYER ({req.persona.title})'}: {m.content}"
        for m in req.messages
        if m.role in ("user", "assistant")
    )

    user_content = (
        f"CONTEXT:\n"
        f"Scenario: {req.scenarioType}\n"
        f"Buyer: {req.persona.title} ({req.persona.buyer_role})\n"
        f"Industry: {req.persona.industry}\n"
        f"Difficulty: {req.persona.difficulty}"
        + (f"\n\n{company_context}" if company_context else "")
        + f"\n\nTRANSCRIPT:\n{transcript_text}"
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SCORING_SYSTEM},
            {"role": "user", "content": user_content},
        ],
    )

    raw_text = response.choices[0].message.content or ""

    try:
        raw_json = normalize_score(json.loads(raw_text))
        parsed_score = SessionScore.model_validate(raw_json)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse score: {exc}") from exc

    score_dict = parsed_score.model_dump()

    # Persist to Supabase
    supabase.table("sessions").update({
        "scores": score_dict,
        "transcript": [m.model_dump() for m in req.messages],
        "scenario_type": req.scenarioType,
    }).eq("id", req.sessionId).execute()

    return ScoreResponse(score=score_dict)
