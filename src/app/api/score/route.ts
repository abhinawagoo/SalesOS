import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { Message, Persona, ScenarioType, SessionScore } from '@/lib/types'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const scoreNum = z.coerce.number().min(1).max(10)

const SubSkill = z.object({
  score: scoreNum,
  explanation: z.string(),
  evidence: z.string().default('No clear evidence'),
})

const Category = z.object({
  score: scoreNum,
  sub_skills: z.record(z.string(), SubSkill),
})

const ScoreSchema = z.object({
  overall_score: scoreNum,
  categories: z.object({
    discovery: Category,
    objection_handling: Category,
    value_articulation: Category,
    closing: Category,
  }),
  coaching: z.object({
    strengths: z.array(z.object({ behavior: z.string(), evidence: z.string().default('No clear evidence') })),
    weaknesses: z.array(z.object({ behavior: z.string(), evidence: z.string().default('No clear evidence') })),
    top_performer_rewrites: z.array(z.object({
      original: z.string(),
      improved: z.string(),
      context: z.string().default('During the conversation'),
    })),
    focus_recommendation: z.string(),
  }),
})

// ─── Scoring Prompt ──────────────────────────────────────────────────────────

const SCORING_SYSTEM = `You are an expert enterprise sales coach. Analyze the SALES REP's performance only (not the buyer).

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
Overall score = average of 4 category scores rounded to 1 decimal.`

// ─── Normalizer (defensive — handles GPT key-casing drift) ──────────────────

function normalizeScore(raw: Record<string, unknown>): Record<string, unknown> {
  // If categories is missing, model may have returned top-level UPPERCASE keys
  if (!raw.categories) {
    const keyMap: Record<string, string> = {
      DISCOVERY: 'discovery',
      OBJECTION_HANDLING: 'objection_handling',
      VALUE_ARTICULATION: 'value_articulation',
      CLOSING: 'closing',
    }
    const cats: Record<string, unknown> = {}
    for (const [upper, lower] of Object.entries(keyMap)) {
      if (raw[upper]) {
        cats[lower] = raw[upper]
        delete raw[upper]
      }
    }
    if (Object.keys(cats).length > 0) raw.categories = cats
  }

  // Normalize coaching arrays
  if (raw.coaching && typeof raw.coaching === 'object') {
    const coaching = raw.coaching as Record<string, unknown>

    // Convert string-only strengths/weaknesses to { behavior, evidence } objects
    for (const field of ['strengths', 'weaknesses'] as const) {
      if (Array.isArray(coaching[field])) {
        coaching[field] = (coaching[field] as unknown[]).map(item =>
          typeof item === 'string'
            ? { behavior: item, evidence: 'No clear evidence' }
            : item
        )
      }
    }

    // Add fallback context to top_performer_rewrites
    if (Array.isArray(coaching.top_performer_rewrites)) {
      coaching.top_performer_rewrites = (coaching.top_performer_rewrites as unknown[]).map(item => {
        if (item && typeof item === 'object') {
          const r = item as Record<string, unknown>
          if (!r.context) r.context = 'During the conversation'
        }
        return item
      })
    }
  }

  return raw
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { sessionId, messages, persona, scenarioType } = await req.json() as {
      sessionId: string
      messages: Message[]
      persona: Persona
      scenarioType: ScenarioType
    }

    const repMessages = messages.filter((m) => m.role === 'user')
    if (repMessages.length === 0) {
      return NextResponse.json({ error: 'No rep messages to score' }, { status: 400 })
    }

    const transcriptText = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role === 'user' ? 'SALES REP' : `BUYER (${persona.title})`}: ${m.content}`)
      .join('\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SCORING_SYSTEM },
        {
          role: 'user',
          content: `CONTEXT:\nScenario: ${scenarioType}\nBuyer: ${persona.title} (${persona.buyer_role})\nIndustry: ${persona.industry}\nDifficulty: ${persona.difficulty}\n\nTRANSCRIPT:\n${transcriptText}`,
        },
      ],
    })

    const rawText = response.choices[0]?.message?.content ?? ''

    let parsedScore: SessionScore
    try {
      const rawJson = normalizeScore(JSON.parse(rawText))
      parsedScore = ScoreSchema.parse(rawJson) as SessionScore
    } catch (parseErr) {
      console.error('Score parse error:', parseErr, rawText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse score' }, { status: 500 })
    }

    await supabase
      .from('sessions')
      .update({ scores: parsedScore, transcript: messages, scenario_type: scenarioType })
      .eq('id', sessionId)

    return NextResponse.json({ score: parsedScore })
  } catch (err) {
    console.error('Scoring error:', err)
    return NextResponse.json({ error: 'Failed to score session' }, { status: 500 })
  }
}
