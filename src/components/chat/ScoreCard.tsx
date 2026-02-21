'use client'

import { SessionScore, Persona } from '@/lib/types'
import { getOverallScore, scoreColor, scoreBg } from '@/lib/utils'
import RepRadarChart from '@/components/dashboard/RepRadarChart'
import Link from 'next/link'

interface ScoreCardProps {
  score: SessionScore
  persona: Persona
  onReset: () => void
}

const SKILL_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  objection_handling: 'Objection Handling',
  value_articulation: 'Value Articulation',
  clarity: 'Clarity',
  closing: 'Closing',
}

export default function ScoreCard({ score, persona, onReset }: ScoreCardProps) {
  const overall = getOverallScore(score.scores)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Session Complete</h1>
          <p className="text-white/40 text-sm mt-1">vs. {persona.title} · {persona.industry}</p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${scoreColor(overall)}`}>{overall}</div>
          <div className="text-xs text-white/30 mt-1">/ 10 overall</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Radar */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Skill Breakdown</h2>
          <RepRadarChart scores={score.scores} />
          <div className="mt-4 space-y-2">
            {Object.entries(score.scores).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-white/40">{SKILL_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-white/10 rounded-full">
                    <div
                      className={`h-full rounded-full ${scoreBg(val)}`}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${scoreColor(val)}`}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + Feedback */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Summary</h2>
            <p className="text-sm text-white/70 leading-relaxed">{score.summary}</p>
          </div>

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-3">Strengths</h2>
              <ul className="space-y-1.5">
                {score.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {score.weaknesses.length > 0 && (
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-3">Areas to Improve</h2>
              <ul className="space-y-1.5">
                {score.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">△</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Coaching */}
      {score.coaching_suggestions.length > 0 && (
        <div className="bg-indigo-500/[0.04] border border-indigo-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-semibold text-indigo-400/70 uppercase tracking-wider mb-4">Coaching Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {score.coaching_suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-indigo-400 flex-shrink-0 mt-0.5">→</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          New Simulation
        </button>
        <Link
          href="/dashboard/rep"
          className="border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  )
}
