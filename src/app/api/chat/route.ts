import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { Persona, Message } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

function buildSystemPrompt(persona: Persona): string {
  const difficultyInstructions = {
    easy: 'Be moderately skeptical. Raise 1-2 objections but be receptive to good answers.',
    medium: 'Be clearly skeptical. Raise multiple objections. Push back on weak answers. Require specific evidence.',
    hard: 'Be highly skeptical and demanding. Challenge every claim. Demand ROI numbers, case studies, and proof. Be time-pressed and impatient.',
  }

  return `You are ${persona.title}, a ${persona.buyer_role} at a ${persona.industry} company.

PERSONALITY: ${persona.personality_traits?.join(', ')}

OBJECTION STYLE: ${persona.objection_style}

DIFFICULTY: ${difficultyInstructions[persona.difficulty]}

RULES:
- Stay completely in character as this buyer. Never break character.
- Be realistic and professional, not cartoonishly hostile.
- Raise real enterprise sales objections: budget, timing, existing solutions, ROI, integration complexity, stakeholder buy-in.
- Ask challenging questions that real buyers ask.
- Do not be easily convinced. Require the rep to earn your trust.
- Keep responses to 2-4 sentences max. You are a busy executive.
- If the rep asks good discovery questions, respond with useful but guarded information.
- If the rep gives vague answers, push back directly.
- Do not volunteer information — make the rep work for it.
- You have evaluated 3 competing solutions already.`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, persona, messages, userMessage } = await req.json() as {
      sessionId: string
      persona: Persona
      messages: Message[]
      userMessage: string | null
    }

    const systemPrompt = buildSystemPrompt(persona)

    // Build message history for Claude
    // Filter to only user/assistant messages (not system)
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant')

    // If no user message (opening), buyer speaks first
    let claudeMessages: Anthropic.MessageParam[]

    if (!userMessage) {
      claudeMessages = [
        {
          role: 'user',
          content: 'Open the conversation. You just got on a sales call. Give your opening statement as this buyer — brief, a bit skeptical. Ask what they want to discuss.',
        },
      ]
    } else {
      claudeMessages = history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Update transcript in DB
    const newTranscript = userMessage
      ? [...messages, { role: 'assistant', content: reply }]
      : [{ role: 'assistant', content: reply }]

    await supabase
      .from('sessions')
      .update({ transcript: newTranscript })
      .eq('id', sessionId)

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
