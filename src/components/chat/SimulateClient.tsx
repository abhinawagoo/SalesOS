'use client'

import { useState, useRef, useEffect } from 'react'
import { Persona, Message, SessionScore, ScenarioType, SCENARIO_LABELS, SCENARIO_DESCRIPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import ScoreCard from '@/components/chat/ScoreCard'

interface SimulateClientProps {
  personas: Persona[]
  userId: string
}

type Phase = 'scenario' | 'persona' | 'chat' | 'scored'

const SCENARIO_ICONS: Record<ScenarioType, string> = {
  cold_outbound: '📞',
  discovery: '🔍',
  objection_handling: '🛡',
  closing: '🤝',
}

export default function SimulateClient({ personas, userId }: SimulateClientProps) {
  const [phase, setPhase] = useState<Phase>('scenario')
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [score, setScore] = useState<SessionScore | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startSession(persona: Persona) {
    setSelectedPersona(persona)
    setLoading(true)

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, personaId: persona.id }),
    })
    const data = await res.json()
    if (!data.sessionId) { setLoading(false); return }

    setSessionId(data.sessionId)

    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: data.sessionId, persona, messages: [], userMessage: null, scenarioType: selectedScenario }),
    })
    const chatData = await chatRes.json()
    setMessages([{ role: 'assistant', content: chatData.reply }])
    setPhase('chat')
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading || !sessionId || !selectedPersona) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, persona: selectedPersona, messages: newMessages, userMessage: input.trim(), scenarioType: selectedScenario }),
    })
    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  async function endSession() {
    if (!sessionId || !selectedPersona || messages.filter(m => m.role === 'user').length === 0) return
    setScoring(true)

    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages, persona: selectedPersona, scenarioType: selectedScenario }),
    })
    const data = await res.json()
    setScore(data.score)
    setPhase('scored')
    setScoring(false)
  }

  function reset() {
    setPhase('scenario')
    setSelectedScenario(null)
    setSelectedPersona(null)
    setSessionId(null)
    setMessages([])
    setInput('')
    setScore(null)
  }

  // ── Scenario selection ──
  if (phase === 'scenario') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">New Simulation</h1>
          <p className="text-white/40 text-sm mt-1">Step 1 of 2 — Select scenario type</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(SCENARIO_LABELS) as ScenarioType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedScenario(type); setPhase('persona') }}
              className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-indigo-500/30 rounded-2xl p-6 transition-all group"
            >
              <div className="text-2xl mb-3">{SCENARIO_ICONS[type]}</div>
              <div className="text-sm font-semibold text-white mb-1">{SCENARIO_LABELS[type]}</div>
              <div className="text-xs text-white/40">{SCENARIO_DESCRIPTIONS[type]}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Persona selection ──
  if (phase === 'persona') {
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 }
    const sorted = [...personas].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => setPhase('scenario')} className="text-xs text-white/30 hover:text-white/60 mb-4 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">New Simulation</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full">{SCENARIO_LABELS[selectedScenario!]}</span>
            <span className="text-white/30 text-xs">Step 2 of 2 — Select buyer</span>
          </div>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-white/30 text-sm">Starting session...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((persona) => (
              <button
                key={persona.id}
                onClick={() => startSession(persona)}
                className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-indigo-500/30 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center font-semibold text-indigo-300">
                    {persona.buyer_role.charAt(0)}
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full',
                    persona.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
                    persona.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  )}>{persona.difficulty}</span>
                </div>
                <div className="text-sm font-semibold text-white mb-1">{persona.title}</div>
                <div className="text-xs text-white/40 mb-3">{persona.buyer_role} · {persona.industry}</div>
                <div className="flex flex-wrap gap-1">
                  {persona.personality_traits?.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Scored ──
  if (phase === 'scored' && score) {
    return <ScoreCard score={score} persona={selectedPersona!} scenarioType={selectedScenario!} onReset={reset} />
  }

  // ── Live chat ──
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600/20 flex items-center justify-center font-semibold text-indigo-300">
            {selectedPersona?.buyer_role.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{selectedPersona?.title}</div>
            <div className="text-xs text-white/40">{selectedPersona?.buyer_role} · {selectedPersona?.industry}</div>
          </div>
          <span className="ml-1 text-xs bg-indigo-600/15 text-indigo-400 px-2 py-0.5 rounded-full">
            {SCENARIO_LABELS[selectedScenario!]}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full',
            selectedPersona?.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' :
            selectedPersona?.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-emerald-500/10 text-emerald-400'
          )}>{selectedPersona?.difficulty}</span>
        </div>
        <button
          onClick={endSession}
          disabled={scoring || messages.filter(m => m.role === 'user').length === 0}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white px-4 py-2 rounded-lg transition-all disabled:opacity-30"
        >
          {scoring ? 'Scoring...' : 'End & Score'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-300 mr-2 flex-shrink-0 mt-0.5">
                {selectedPersona?.buyer_role.charAt(0)}
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-white/[0.06] text-white/85 border border-white/8 rounded-tl-sm'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs mr-2">
              {selectedPersona?.buyer_role.charAt(0)}
            </div>
            <div className="bg-white/[0.06] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/5 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Your response to the buyer..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-white/20 text-center">
          {messages.filter(m => m.role === 'user').length} rep messages · End session to get your scored analysis
        </div>
      </div>
    </div>
  )
}
