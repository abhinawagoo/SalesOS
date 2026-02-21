import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { Message, Persona, ScenarioType, SessionScore } from '@/lib/types'
import { z } from 'zod'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const SubSkill = z.object({
  score: z.number().min(1).max(10),
  explanation: z.string(),
  evidence: z.string(),
})

const Category = z.object({
  score: z.number().min(1).max(10),
  sub_skills: z.record(z.string(), SubSkill),
})

const ScoreSchema = z.object({
  overall_score: z.number().min(1).max(10),
  categories: z.object({
    discovery: Category,
    objection_handling: Category,
    value_articulation: Category,
    closing: Category,
  }),
  coaching: z.object({
    strengths: z.array(z.object({ behavior: z.string(), evidence: z.string() })),
    weaknesses: z.array(z.object({ behavior: z.string(), evidence: z.string() })),
    top_performer_rewrites: z.array(z.object({
      original: z.string(),
      improved: z.string(),
      context: z.string(),
    })),
    focus_recommendation: z.string(),
  }),
})

// ─── Scoring Prompt ──────────────────────────────────────────────────────────

const SCORING_SYSTEM = `You are an expert enterprise sales coach. Analyze the SALES REP's performance only (not the buyer).

Score 4 categories, each with 3 sub-skills (scale 1-10):

DISCOVERY
- problem_depth: Did they uncover deep pain, root causes, and business impact?
- quantification: Did they quantify the problem in business terms (revenue, cost, time)?
- stakeholder_identification: Did they identify decision makers and influencers?

OBJECTION_HANDLING
- acknowledgement: Did they empathetically acknowledge objections before responding?
- reframing: Did they reframe objections into value opportunities?
- confidence_control: Did they stay in control and confident under pressure?

VALUE_ARTICULATION
- roi_clarity: Did they present specific ROI tied to this buyer's situation?
- differentiation: Did they differentiate from alternatives/status quo concretely?
- use_case_relevance: Did they map the solution to this buyer's exact use case?

CLOSING
- clear_next_step: Did they propose a specific, concrete next step?
- timeline_alignment: Did they understand and work with the buyer's timeline?
- commitment_securing: Did they get any form of commitment or micro-agreement?

For each sub-skill provide:
- score (1-10)
- explanation (1-2 sentences of analysis)
- evidence (exact direct quote from rep in transcript, or "No clear evidence")

Category score = average of its 3 sub-skills (1 decimal).
Overall score = average of 4 categories (1 decimal).

Coaching section:
- strengths: exactly 3 strong behaviors with evidence quotes
- weaknesses: exactly 3 improvement areas with evidence quotes
- top_performer_rewrites: 2-3 cases where rep was weak — show original rep quote and an improved top-performer version
- focus_recommendation: one specific sentence on what to work on next

Return ONLY valid JSON. No markdown, no code blocks, no extra text.`

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
      parsedScore = ScoreSchema.parse(JSON.parse(rawText)) as SessionScore
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
