import { NextRequest, NextResponse } from 'next/server'
import { Message, Persona, ScenarioType, SessionScore } from '@/lib/types'
import { callPython } from '@/lib/python-backend'

export async function POST(req: NextRequest) {
  try {
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

    const data = await callPython<{ score: SessionScore }>('/score', {
      sessionId,
      messages,
      persona,
      scenarioType,
    })

    return NextResponse.json({ score: data.score })
  } catch (err) {
    console.error('Scoring error:', err)
    return NextResponse.json({ error: 'Failed to score session' }, { status: 500 })
  }
}
