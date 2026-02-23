import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
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
