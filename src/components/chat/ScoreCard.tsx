'use client'

import { useState } from 'react'
import { SessionScore, Persona, ScenarioType, SCENARIO_LABELS, Message } from '@/lib/types'
import { scoreColor, scoreBg, cn } from '@/lib/utils'
import Link from 'next/link'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart'
import ScoreGauge from '@/components/analytics/ScoreGauge'

interface ScoreCardProps {
  score: SessionScore
  persona: Persona
  scenarioType: ScenarioType
  messages: Message[]
  onReset: () => void
}

const CATEGORY_META = {
  discovery: {
    label: 'Discovery',
    sub_skills: { problem_depth: 'Problem Depth', quantification: 'Quantification', stakeholder_identification: 'Stakeholder ID' },
  },
  objection_handling: {
    label: 'Objection Handling',
    sub_skills: { acknowledgement: 'Acknowledgement', reframing: 'Reframing', confidence_control: 'Confidence & Control' },
  },
  value_articulation: {
    label: 'Value Articulation',
    sub_skills: { roi_clarity: 'ROI Clarity', differentiation: 'Differentiation', use_case_relevance: 'Use-Case Relevance' },
  },
  closing: {
    label: 'Closing',
    sub_skills: { clear_next_step: 'Clear Next Step', timeline_alignment: 'Timeline Alignment', commitment_securing: 'Commitment Securing' },
  },
}

type Tab = 'breakdown' | 'strengths' | 'weaknesses' | 'rewrites' | 'focus' | 'transcript'

export default function ScoreCard({ score, persona, scenarioType, messages, onReset }: ScoreCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('breakdown')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('discovery')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'breakdown', label: 'Skill Breakdown' },
    { id: 'strengths', label: `Strengths (${score.coaching.strengths.length})` },
    { id: 'weaknesses', label: `Improve (${score.coaching.weaknesses.length})` },
    { id: 'rewrites', label: 'Top Performer' },
    { id: 'focus', label: 'Focus' },
    { id: 'transcript', label: 'Transcript' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Session Complete</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-indigo-600/15 text-indigo-400 px-2 py-0.5 rounded-full">{SCENARIO_LABELS[scenarioType]}</span>
            <span className="text-xs text-white/30">vs. {persona.title} · {persona.industry}</span>
          </div>
        </div>
        <ScoreGauge score={score.overall_score} label="Overall" size={120} />
      </div>

      {/* Category summary row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(Object.entries(CATEGORY_META) as [keyof typeof CATEGORY_META, typeof CATEGORY_META[keyof typeof CATEGORY_META]][]).map(([key, meta]) => {
          const cat = score.categories[key]
          return (
            <div key={key} className={cn('rounded-xl p-4 border', scoreBgFull(cat.score))}>
              <div className="text-xs text-white/40 mb-1">{meta.label}</div>
              <div className={`text-2xl font-bold ${scoreColor(cat.score)}`}>{cat.score}</div>
              <div className="text-[10px] text-white/30">/10</div>
            </div>
          )
        })}
      </div>

      {/* Focus recommendation banner */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-3 mb-6 flex items-start gap-3">
        <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Focus for next session: </span>
          <span className="text-sm text-white/70">{score.coaching.focus_recommendation}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <h3 className="text-xs text-white/40 uppercase tracking-wider mb-4">Radar</h3>
            <CategoryRadarChart scores={{
              discovery: score.categories.discovery.score,
              objection_handling: score.categories.objection_handling.score,
              value_articulation: score.categories.value_articulation.score,
              closing: score.categories.closing.score,
            }} />
          </div>
          <div className="lg:col-span-3 space-y-2">
            {(Object.entries(CATEGORY_META) as [keyof typeof CATEGORY_META, typeof CATEGORY_META[keyof typeof CATEGORY_META]][]).map(([key, meta]) => {
              const cat = score.categories[key]
              const isOpen = expandedCategory === key
              return (
                <div key={key} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${scoreColor(cat.score)} bg-white/5`}>
                        {cat.score}
                      </div>
                      <span className="text-sm text-white/80">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full">
                        <div className={`h-full rounded-full ${scoreBg(cat.score)}`} style={{ width: `${(cat.score/10)*100}%` }} />
                      </div>
                      <span className="text-white/30 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {Object.entries(meta.sub_skills).map(([sk, skLabel]) => {
                        const subSkill = (cat.sub_skills as Record<string, { score: number; explanation: string; evidence: string }>)[sk]
                        return (
                          <div key={sk} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-white/60">{skLabel}</span>
                              <span className={`text-xs font-bold ${scoreColor(subSkill.score)}`}>{subSkill.score}/10</span>
                            </div>
                            <p className="text-xs text-white/40 mb-1.5">{subSkill.explanation}</p>
                            {subSkill.evidence && subSkill.evidence !== 'No clear evidence' && (
                              <blockquote className="text-xs text-white/30 italic border-l-2 border-white/10 pl-2">
                                &quot;{subSkill.evidence}&quot;
                              </blockquote>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Strengths */}
      {activeTab === 'strengths' && (
        <div className="space-y-3">
          {score.coaching.strengths.map((s, i) => (
            <div key={i} className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0 font-bold">{i + 1}</span>
                <div>
                  <p className="text-sm text-white/80 mb-2">{s.behavior}</p>
                  <blockquote className="text-xs text-emerald-400/60 italic border-l-2 border-emerald-500/20 pl-2">
                    &quot;{s.evidence}&quot;
                  </blockquote>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Weaknesses */}
      {activeTab === 'weaknesses' && (
        <div className="space-y-3">
          {score.coaching.weaknesses.map((w, i) => (
            <div key={i} className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">{i + 1}</span>
                <div>
                  <p className="text-sm text-white/80 mb-2">{w.behavior}</p>
                  <blockquote className="text-xs text-red-400/60 italic border-l-2 border-red-500/20 pl-2">
                    &quot;{w.evidence}&quot;
                  </blockquote>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Top Performer Rewrites */}
      {activeTab === 'rewrites' && (
        <div className="space-y-4">
          <p className="text-xs text-white/30 mb-4">See exactly what a top performer would say in situations where you were weak.</p>
          {score.coaching.top_performer_rewrites.map((r, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5">
                <span className="text-xs text-white/30">Context: {r.context}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                <div className="p-4">
                  <div className="text-[10px] text-red-400/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span>✗</span> What you said
                  </div>
                  <p className="text-sm text-white/50 italic">&quot;{r.original}&quot;</p>
                </div>
                <div className="p-4">
                  <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span>✓</span> Top performer would say
                  </div>
                  <p className="text-sm text-emerald-300/80 italic">&quot;{r.improved}&quot;</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Focus */}
      {activeTab === 'focus' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 text-2xl">🎯</div>
          <h3 className="text-lg font-semibold text-white mb-3">Next Session Focus</h3>
          <p className="text-white/60 text-sm leading-relaxed">{score.coaching.focus_recommendation}</p>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-xs text-white/30 mb-3">Weakest category this session</div>
            {(() => {
              const cats = score.categories
              const min = Object.entries(cats).reduce((a, b) => a[1].score < b[1].score ? a : b)
              return (
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  <span className="text-red-400 font-bold text-lg">{min[1].score}</span>
                  <span className="text-red-400/80 text-sm">{CATEGORY_META[min[0] as keyof typeof CATEGORY_META]?.label}</span>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Tab: Transcript */}
      {activeTab === 'transcript' && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {messages.filter(m => m.role !== 'system').map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-300 mr-2 flex-shrink-0 mt-0.5">
                  {persona.buyer_role.charAt(0)}
                </div>
              )}
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600/20 text-white/90 rounded-tr-sm border border-indigo-500/20'
                  : 'bg-white/[0.06] text-white/75 border border-white/8 rounded-tl-sm'
              )}>
                <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">
                  {msg.role === 'user' ? 'You' : persona.buyer_role}
                </div>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button onClick={onReset} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors">
          New Simulation
        </button>
        <Link href="/dashboard/rep" className="border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-6 py-2.5 rounded-xl text-sm transition-all">
          View Dashboard
        </Link>
      </div>
    </div>
  )
}

function scoreBgFull(score: number): string {
  if (score >= 8) return 'bg-emerald-500/5 border-emerald-500/15'
  if (score >= 6) return 'bg-yellow-500/5 border-yellow-500/15'
  return 'bg-red-500/5 border-red-500/15'
}
