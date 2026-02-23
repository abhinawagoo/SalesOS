'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Persona, Message, ScenarioType, SCENARIO_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VoiceChatProps {
  sessionId: string
  persona: Persona
  scenarioType: ScenarioType
  initialAIMessage: string
  onEnd: (messages: Message[]) => void
  onSwitchToText: () => void
}

type CallStatus = 'idle' | 'ai_speaking' | 'user_turn' | 'thinking'

// SpeechRecognition is browser-native (Chrome); typed as any for compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export default function VoiceChat({ sessionId, persona, scenarioType, initialAIMessage, onEnd, onSwitchToText }: VoiceChatProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('ai_speaking')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: initialAIMessage }])
  const [liveTranscript, setLiveTranscript] = useState('')
  const [lastMessage, setLastMessage] = useState<Message>({ role: 'assistant', content: initialAIMessage })
  const [seconds, setSeconds] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  const recognitionRef = useRef<AnySpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesRef = useRef<Message[]>([{ role: 'assistant', content: initialAIMessage }])

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const playTTS = useCallback(async (text: string) => {
    setCallStatus('ai_speaking')
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }

      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setCallStatus('user_turn')
      }
    } catch {
      setCallStatus('user_turn')
    }
  }, [])

  // Play initial message on mount
  useEffect(() => {
    playTTS(initialAIMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const handleSpeechResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      setCallStatus('user_turn')
      return
    }

    const userMsg: Message = { role: 'user', content: transcript }
    const newMessages = [...messagesRef.current, userMsg]
    messagesRef.current = newMessages
    setMessages(newMessages)
    setLastMessage(userMsg)
    setLiveTranscript('')
    setCallStatus('thinking')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          persona,
          messages: newMessages,
          userMessage: transcript,
          scenarioType,
        }),
      })
      const data = await res.json()
      const aiMsg: Message = { role: 'assistant', content: data.reply }
      const withAI = [...newMessages, aiMsg]
      messagesRef.current = withAI
      setMessages(withAI)
      setLastMessage(aiMsg)
      await playTTS(data.reply)
    } catch {
      setCallStatus('user_turn')
    }
  }, [sessionId, persona, scenarioType, playTTS])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setMicError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    setMicError(null)
    setLiveTranscript('')
    setIsListening(true)
    setCallStatus('user_turn')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognitionRef.current = recognition

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setLiveTranscript(interim || final)
      if (final) {
        stopListening()
        handleSpeechResult(final)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Please allow mic access and try again.')
      }
      setIsListening(false)
      setCallStatus('user_turn')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [stopListening, handleSpeechResult])

  function handleEndCall() {
    if (audioRef.current) audioRef.current.pause()
    stopListening()
    if (timerRef.current) clearInterval(timerRef.current)
    onEnd(messagesRef.current)
  }

  const statusLabel: Record<CallStatus, string> = {
    idle: 'Ready',
    ai_speaking: `${persona.buyer_role} is speaking...`,
    user_turn: 'Your turn — tap the mic',
    thinking: 'Thinking...',
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600/20 flex items-center justify-center font-semibold text-indigo-300">
            {persona.buyer_role.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{persona.title}</div>
            <div className="text-xs text-white/40">{persona.buyer_role} · {persona.industry}</div>
          </div>
          <span className="ml-1 text-xs bg-indigo-600/15 text-indigo-400 px-2 py-0.5 rounded-full">
            {SCENARIO_LABELS[scenarioType]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white/40">{formatTime(seconds)}</span>
          <button
            onClick={onSwitchToText}
            className="text-xs text-white/30 hover:text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            ⌨ Text
          </button>
        </div>
      </div>

      {/* Main call area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Avatar */}
        <div className={cn(
          'w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-300 transition-all duration-300',
          callStatus === 'ai_speaking'
            ? 'bg-indigo-600/30 ring-4 ring-indigo-500/40 ring-offset-4 ring-offset-[#0a0a0f]'
            : 'bg-indigo-600/15'
        )}>
          {persona.buyer_role.charAt(0)}
        </div>

        {/* Waveform — animated bars */}
        <div className="flex items-center gap-1 h-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full transition-all',
                callStatus === 'ai_speaking' ? 'bg-indigo-400' :
                callStatus === 'user_turn' && isListening ? 'bg-emerald-400' :
                'bg-white/10'
              )}
              style={{
                height: (callStatus === 'ai_speaking' || (callStatus === 'user_turn' && isListening))
                  ? `${12 + Math.sin(i * 0.8) * 10 + Math.cos(i * 1.3) * 8}px`
                  : '4px',
                animation: (callStatus === 'ai_speaking' || (callStatus === 'user_turn' && isListening))
                  ? `pulse ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`
                  : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Last message bubble */}
        <div className="max-w-lg w-full">
          <div className={cn(
            'rounded-2xl px-5 py-4 text-sm leading-relaxed text-center',
            lastMessage.role === 'assistant'
              ? 'bg-white/[0.06] text-white/80 border border-white/8'
              : 'bg-indigo-600/20 text-white/90 border border-indigo-500/20'
          )}>
            <div className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
              {lastMessage.role === 'assistant' ? persona.buyer_role : 'You'}
            </div>
            {lastMessage.content}
          </div>
        </div>

        {/* Live transcript */}
        {liveTranscript && (
          <div className="text-sm text-white/40 italic text-center max-w-md">
            {liveTranscript}
          </div>
        )}

        {/* Status */}
        <div className="text-sm text-white/40">{statusLabel[callStatus]}</div>

        {/* Mic error */}
        {micError && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-center max-w-sm">
            {micError}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-white/5 px-6 py-6 flex flex-col items-center gap-4">
        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={callStatus === 'ai_speaking' || callStatus === 'thinking'}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200',
            isListening
              ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
              : callStatus === 'user_turn'
              ? 'bg-indigo-600/30 border-2 border-indigo-400/60 text-indigo-300 hover:bg-indigo-600/50 hover:border-indigo-400'
              : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
          )}
        >
          🎙
        </button>
        <span className="text-xs text-white/30">
          {isListening ? 'Tap to stop' : 'Tap to speak'}
        </span>

        {/* End call */}
        <button
          onClick={handleEndCall}
          disabled={messagesRef.current.filter(m => m.role === 'user').length === 0}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-30"
        >
          ✕ End Call & Score
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.6); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  )
}
