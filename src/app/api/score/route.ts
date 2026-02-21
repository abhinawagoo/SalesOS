import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Message, Persona, SessionScore } from '@/lib/types'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const ScoreSchema = z.object({
  scores: z.object({
    discovery: z.number().min(0).max(10),
    objection_handling: z.number().min(0).max(10),
    value_articulation: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    closing: z.number().min(0).max(10),
  }),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  coaching_suggestions: z.array(z.string()),
})

const SCORING_PROMPT = `You are an expert sales coach analyzing a sales conversation transcript.

Analyze the SALES REP's performance (NOT the buyer). Score on these 5 dimensions (0-10):

- discovery: Did they ask effective open-ended questions? Uncover needs and pain points?
- objection_handling: Did they address objections directly? Use proof and reframes?
- value_articulation: Did they clearly communicate value specific to this buyer?
- clarity: Were their explanations clear, concise, and confident?
- closing: Did they drive toward next steps? Create urgency appropriately?

Scoring guide:
- 9-10: Exceptional, best-in-class
- 7-8: Strong, above average
- 5-6: Developing, needs improvement
- 3-4: Weak, major gaps
- 0-2: Poor, fundamental issues

CRITICAL: Return ONLY valid JSON with this exact structure. No preamble, no markdown:
{
  "scores": {
    "discovery": <number>,
    "objection_handling": <number>,
    "value_articulation": <number>,
    "clarity": <number>,
    "closing": <number>
  },
  "summary": "<2-3 sentence objective summary of the rep's overall performance>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>"],
  "coaching_suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"]
}`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, messages, persona } = await req.json() as {
      sessionId: string
      messages: Message[]
      persona: Persona
    }

    // Build transcript text
    const repMessages = messages.filter((m) => m.role === 'user')
    const buyerMessages = messages.filter((m) => m.role === 'assistant')

    if (repMessages.length === 0) {
      return NextResponse.json({ error: 'No rep messages to score' }, { status: 400 })
    }

    const transcriptText = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role === 'user' ? 'SALES REP' : `BUYER (${persona.title})`}: ${m.content}`)
      .join('\n\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${SCORING_PROMPT}\n\nBUYER CONTEXT:\nPersona: ${persona.title}\nRole: ${persona.buyer_role}\nIndustry: ${persona.industry}\nDifficulty: ${persona.difficulty}\n\nTRANSCRIPT:\n${transcriptText}`,
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse and validate JSON
    let parsedScore: SessionScore
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')

      const parsed = JSON.parse(jsonMatch[0])
      parsedScore = ScoreSchema.parse(parsed)
    } catch (parseErr) {
      console.error('Score parsing error:', parseErr, rawText)
      return NextResponse.json({ error: 'Failed to parse score' }, { status: 500 })
    }

    // Save score to DB
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        scores: parsedScore,
        transcript: messages,
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('DB update error:', updateError)
    }

    return NextResponse.json({ score: parsedScore })
  } catch (err) {
    console.error('Scoring error:', err)
    return NextResponse.json({ error: 'Failed to score session' }, { status: 500 })
  }
}
