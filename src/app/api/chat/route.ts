import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import { callPython } from '@/lib/python-backend'
import { Persona, Message, ScenarioType } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const SCENARIO_CONTEXT: Record<ScenarioType, string> = {
  cold_outbound: 'This is a cold outreach call. You were not expecting this call. Be naturally skeptical about giving time and question their relevance immediately.',
  discovery: 'This is a discovery call. You agreed to learn more. Be somewhat open but make the rep work to uncover your pain — don\'t volunteer information.',
  objection_handling: 'The rep has already pitched you. You have serious concerns. Push back hard on budget, timing, and existing solutions.',
  closing: 'You have evaluated the solution. Now you\'re stalling. The rep needs to address final objections and get you to commit to a next step.',
}

function buildSystemPrompt(persona: Persona, scenarioType: ScenarioType, language?: string, knowledgeContext?: string): string {
  const difficulty = {
    easy: 'Be moderately skeptical. Raise 1-2 objections but respond to good answers.',
    medium: 'Be clearly skeptical. Raise multiple objections. Push back on weak or vague answers.',
    hard: 'Be highly skeptical. Challenge every claim. Demand ROI proof, reference customers, and specific numbers. You are time-pressed and have seen 3 competing solutions.',
  }

  const languageInstruction = language && language !== 'en-US'
    ? `\nLANGUAGE: Respond ONLY in ${language}. The entire conversation must be in this language.`
    : ''

  const knowledgeSection = knowledgeContext
    ? `\n\nCOMPANY KNOWLEDGE (use this to make objections and responses realistic):\n${knowledgeContext}`
    : ''

  return `You are ${persona.title}, a ${persona.buyer_role} at a ${persona.industry} company.

PERSONALITY: ${persona.personality_traits?.join(', ')}
OBJECTION STYLE: ${persona.objection_style}
SCENARIO: ${SCENARIO_CONTEXT[scenarioType]}
DIFFICULTY: ${difficulty[persona.difficulty]}${languageInstruction}${knowledgeSection}

RULES:
- Stay completely in character. Never break character or acknowledge being AI.
- Be realistic, not cartoonishly hostile.
- Introduce at least one of: budget concern, timing conflict, competitor mention, or status quo defense.
- Keep every response to 2-4 sentences max. You are a busy executive.
- Do not volunteer information — make the rep earn it.
- Push back directly on vague or weak responses.
- If the rep earns it with good questions and answers, gradually soften — but stay skeptical.`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { sessionId, persona, messages, userMessage, scenarioType, language } = await req.json() as {
      sessionId: string
      persona: Persona
      messages: Message[]
      userMessage: string | null
      scenarioType: ScenarioType
      language?: string
    }

    // Retrieve relevant company knowledge for realism (last user message or opening)
    const queryText = userMessage ?? `${persona.buyer_role} ${persona.industry} ${scenarioType}`
    const { context: knowledgeContext } = await callPython<{ context: string }>('/rag/retrieve', {
      query: queryText,
      org_id: DEMO_USER.organization_id,
      limit: 3,
    }).catch(() => ({ context: '' }))

    const systemPrompt = buildSystemPrompt(persona, scenarioType, language, knowledgeContext || undefined)
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant')

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = !userMessage
      ? [{ role: 'user', content: 'Start the call. You just answered the phone or joined the meeting. Give a brief, slightly skeptical opening — 1-2 sentences max.' }]
      : history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 250,
      messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
    })

    const reply = response.choices[0]?.message?.content ?? ''

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
