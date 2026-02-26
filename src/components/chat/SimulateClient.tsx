'use client'

import { useState, useEffect } from 'react'
import { Persona, Message, SessionScore, ScenarioType, SCENARIO_LABELS, SCENARIO_DESCRIPTIONS } from '@/lib/types'
import { LANGUAGES } from '@/lib/languages'
import { cn } from '@/lib/utils'
import ScoreCard from '@/components/chat/ScoreCard'
import VoiceChat from '@/components/chat/VoiceChat'

interface SimulateClientProps {
  personas: Persona[]
  userId: string
}

type Phase = 'scenario' | 'persona' | 'pre-call' | 'call' | 'scoring' | 'scored'

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
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')

  // Read default language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pref_language')
    if (saved) setSelectedLanguage(saved)
  }, [])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<SessionScore | null>(null)

  async function startSession() {
    if (!selectedPersona) return
    setLoading(true)

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, personaId: selectedPersona.id }),
    })
    const data = await res.json()
    if (!data.sessionId) { setLoading(false); return }

    setSessionId(data.sessionId)

    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: data.sessionId,
        persona: selectedPersona,
        messages: [],
        userMessage: null,
        scenarioType: selectedScenario,
        language: selectedLanguage,
      }),
    })
    const chatData = await chatRes.json()
    setMessages([{ role: 'assistant', content: chatData.reply }])
    setPhase('call')
    setLoading(false)
  }

  async function handleCallEnd(voiceMessages: Message[]) {
    setMessages(voiceMessages)
    if (voiceMessages.filter(m => m.role === 'user').length === 0) {
      reset()
      return
    }
    setPhase('scoring')

    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        messages: voiceMessages,
        persona: selectedPersona,
        scenarioType: selectedScenario,
      }),
    })
    const data = await res.json()
    setScore(data.score)
    setPhase('scored')
  }

  function reset() {
    setPhase('scenario')
    setSelectedScenario(null)
    setSelectedPersona(null)
    setSessionId(null)
    setMessages([])
    setScore(null)
    setSelectedLanguage(localStorage.getItem('pref_language') || 'en-US')
  }

  // ── Scenario selection ──
  if (phase === 'scenario') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">New Roleplay</h1>
          <p className="text-white/40 text-sm mt-1">Step 1 of 3 — Select scenario type</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(SCENARIO_LABELS) as ScenarioType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedScenario(type); setPhase('persona') }}
              className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-indigo-500/30 rounded-2xl p-6 transition-all"
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
          <h1 className="text-2xl font-bold text-white">New Roleplay</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full">{SCENARIO_LABELS[selectedScenario!]}</span>
            <span className="text-white/30 text-xs">Step 2 of 3 — Select buyer</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((persona) => (
            <button
              key={persona.id}
              onClick={() => { setSelectedPersona(persona); setPhase('pre-call') }}
              className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-indigo-500/30 rounded-2xl p-6 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center font-semibold text-indigo-300 text-lg">
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
      </div>
    )
  }

  // ── Pre-call: language + confirm ──
  if (phase === 'pre-call' && selectedPersona) {
    const voiceName = selectedPersona.voice
      ? selectedPersona.voice.charAt(0).toUpperCase() + selectedPersona.voice.slice(1)
      : 'Nova'

    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="mb-8">
          <button onClick={() => setPhase('persona')} className="text-xs text-white/30 hover:text-white/60 mb-4 flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Call Setup</h1>
          <p className="text-white/40 text-sm mt-1">Step 3 of 3 — Configure your call</p>
        </div>

        {/* Persona summary */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center font-semibold text-indigo-300">
              {selectedPersona.buyer_role.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{selectedPersona.title}</div>
              <div className="text-xs text-white/40">{selectedPersona.buyer_role} · {selectedPersona.industry}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <span>🎙 Voice: <span className="text-indigo-400/80">{voiceName}</span></span>
            <span>·</span>
            <span className={cn(
              selectedPersona.difficulty === 'hard' ? 'text-red-400/70' :
              selectedPersona.difficulty === 'medium' ? 'text-yellow-400/70' :
              'text-emerald-400/70'
            )}>{selectedPersona.difficulty} difficulty</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-6">
          <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">Call Language</label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all',
                  selectedLanguage === lang.code
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/[0.03] border-white/8 text-white/50 hover:border-white/20 hover:text-white/70'
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="text-xs">{lang.label}</span>
              </button>
            ))}
          </div>
          {selectedLanguage !== 'en-US' && (
            <p className="text-[10px] text-yellow-400/60 mt-2">
              Note: Speech recognition in non-English languages works best in Chrome.
            </p>
          )}
        </div>

        {/* Start call button */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
            <span className="text-sm text-white/30">Connecting call...</span>
          </div>
        ) : (
          <button
            onClick={startSession}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-base">🎙</span> Start Call
          </button>
        )}
      </div>
    )
  }

  // ── Scoring in progress ──
  if (phase === 'scoring') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 text-2xl">◈</div>
          <div className="text-white text-sm font-medium mb-1">Analyzing your call...</div>
          <div className="text-white/30 text-xs mb-4">This usually takes 15–25 seconds</div>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── Scored ──
  if (phase === 'scored' && score) {
    return (
      <ScoreCard
        score={score}
        persona={selectedPersona!}
        scenarioType={selectedScenario!}
        messages={messages}
        onReset={reset}
      />
    )
  }

  // ── Live voice call ──
  return (
    <VoiceChat
      sessionId={sessionId!}
      persona={selectedPersona!}
      scenarioType={selectedScenario!}
      initialAIMessage={messages[0]?.content ?? ''}
      language={selectedLanguage}
      onEnd={handleCallEnd}
      onSwitchToText={reset}
    />
  )
}
