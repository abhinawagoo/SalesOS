import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
type Voice = typeof VALID_VOICES[number]

function sanitizeVoice(v: unknown): Voice {
  if (typeof v === 'string' && VALID_VOICES.includes(v as Voice)) return v as Voice
  return 'nova'
}

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: sanitizeVoice(voice),
    input: text,
  })

  const buffer = Buffer.from(await mp3.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength.toString(),
    },
  })
}
