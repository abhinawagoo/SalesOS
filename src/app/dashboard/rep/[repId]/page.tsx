import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Session, SCENARIO_LABELS } from '@/lib/types'
import { avgScores, formatDate, scoreColor, scoreBg } from '@/lib/utils'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart'
import ScoreProgressionChart from '@/components/dashboard/ScoreProgressionChart'

const HEATMAP_META = {
  discovery: {
    label: 'Discovery',
    sub_skills: { problem_depth: 'Problem Depth', quantification: 'Quantification', stakeholder_identification: 'Stakeholder ID' },
  },
  objection_handling: {
    label: 'Objection',
    sub_skills: { acknowledgement: 'Acknowledgement', reframing: 'Reframing', confidence_control: 'Confidence' },
  },
  value_articulation: {
    label: 'Value',
    sub_skills: { roi_clarity: 'ROI Clarity', differentiation: 'Differentiation', use_case_relevance: 'Use-Case Fit' },
  },
  closing: {
    label: 'Closing',
    sub_skills: { clear_next_step: 'Next Step', timeline_alignment: 'Timeline', commitment_securing: 'Commitment' },
  },
}

export default async function RepDetailPage({ params }: { params: Promise<{ repId: string }> }) {
  const { repId } = await params
  const supabase = createAdminClient()

  const [{ data: rep }, { data: sessions }] = await Promise.all([
    supabase.from('users').select('*').eq('id', repId).single(),
    supabase
      .from('sessions')
      .select('*, personas(title, industry, difficulty)')
      .eq('user_id', repId)
      .order('created_at', { ascending: true }),
  ])

  if (!rep) {
    return (
      <div className="p-8 text-white/40 text-sm">
        Rep not found. <Link href="/dashboard/manager" className="text-indigo-400 hover:text-indigo-300">← Back to team</Link>
      </div>
    )
  }

  const avgs = avgScores(sessions || [])
  const completed = (sessions || []).filter((s: Session) => s.scores !== null)

  function subSkillAvg(catKey: string, subKey: string): number | null {
    const vals = completed
      .map(s => (s.scores?.categories as Record<string, { sub_skills: Record<string, { score: number }> }>)?.[catKey]?.sub_skills?.[subKey]?.score)
      .filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
  }

  const progressionData = completed.map(s => ({
    date: formatDate(s.created_at),
    overall: s.scores!.overall_score,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/manager" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            ← Team
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
              {rep.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{rep.name}</h1>
              <p className="text-white/40 text-xs">{rep.email}</p>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/20 capitalize bg-white/5 px-3 py-1 rounded-full">{rep.role}</div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <StatCard label="Sessions" value={String(sessions?.length || 0)} />
        <StatCard label="Overall" value={avgs ? `${avgs.overall}` : '—'} highlight={avgs ? scoreColor(avgs.overall) : ''} />
        <StatCard label="Discovery" value={avgs ? `${avgs.discovery}` : '—'} highlight={avgs ? scoreColor(avgs.discovery) : ''} />
        <StatCard label="Objection" value={avgs ? `${avgs.objection_handling}` : '—'} highlight={avgs ? scoreColor(avgs.objection_handling) : ''} />
        <StatCard label="Value" value={avgs ? `${avgs.value_articulation}` : '—'} highlight={avgs ? scoreColor(avgs.value_articulation) : ''} />
        <StatCard label="Closing" value={avgs ? `${avgs.closing}` : '—'} highlight={avgs ? scoreColor(avgs.closing) : ''} />
      </div>

      {/* Skill Heatmap + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Heatmap */}
        <div className="lg:col-span-3 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Skill Heatmap</h2>
          {completed.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">No completed sessions</div>
          ) : (
            <div className="space-y-3">
              {(Object.entries(HEATMAP_META) as [keyof typeof HEATMAP_META, typeof HEATMAP_META[keyof typeof HEATMAP_META]][]).map(([catKey, meta]) => {
                const catAvg = avgs ? avgs[catKey === 'discovery' ? 'discovery' : catKey === 'objection_handling' ? 'objection_handling' : catKey === 'value_articulation' ? 'value_articulation' : 'closing'] : null
                return (
                  <div key={catKey}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-white/40 w-20 flex-shrink-0">{meta.label}</span>
                      {catAvg !== null && (
                        <span className={`text-xs font-bold ${scoreColor(catAvg)} w-7`}>{catAvg}</span>
                      )}
                      <div className="flex gap-1.5 flex-1">
                        {Object.entries(meta.sub_skills).map(([sk, skLabel]) => {
                          const val = subSkillAvg(catKey, sk)
                          return (
                            <div
                              key={sk}
                              className={`flex-1 rounded-lg p-2 text-center ${
                                val === null ? 'bg-white/5' :
                                val >= 8 ? 'bg-emerald-500/15 border border-emerald-500/20' :
                                val >= 6 ? 'bg-yellow-500/15 border border-yellow-500/20' :
                                'bg-red-500/15 border border-red-500/20'
                              }`}
                            >
                              <div className={`text-sm font-bold ${val === null ? 'text-white/20' : scoreColor(val)}`}>
                                {val ?? '—'}
                              </div>
                              <div className="text-[9px] text-white/30 mt-0.5 leading-tight">{skLabel}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Radar + Progression */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex-1">
            <h2 className="text-sm font-semibold text-white/70 mb-3">Skill Radar</h2>
            {avgs ? (
              <CategoryRadarChart scores={{
                discovery: avgs.discovery,
                objection_handling: avgs.objection_handling,
                value_articulation: avgs.value_articulation,
                closing: avgs.closing,
              }} />
            ) : (
              <div className="h-40 flex items-center justify-center text-white/20 text-sm">No data</div>
            )}
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-3">Score Trend</h2>
            <ScoreProgressionChart data={progressionData} />
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/70">Session History</h2>
        </div>
        {sessions && sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Date', 'Persona', 'Scenario', 'Overall', 'Discovery', 'Objection', 'Value', 'Closing'].map(h => (
                    <th key={h} className="text-left text-xs text-white/30 px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...(sessions || [])].reverse().map((s: Session & { personas: { title: string; difficulty: string } }) => {
                  const sc = s.scores
                  return (
                    <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-white/70">{s.personas?.title}</div>
                        <div className={`text-[10px] capitalize ${
                          s.personas?.difficulty === 'hard' ? 'text-red-400/60' :
                          s.personas?.difficulty === 'medium' ? 'text-yellow-400/60' : 'text-emerald-400/60'
                        }`}>{s.personas?.difficulty}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                        {SCENARIO_LABELS[s.scenario_type as keyof typeof SCENARIO_LABELS] ?? '—'}
                      </td>
                      <ScoreCell value={sc?.overall_score ?? null} />
                      <ScoreCell value={sc?.categories.discovery.score ?? null} />
                      <ScoreCell value={sc?.categories.objection_handling.score ?? null} />
                      <ScoreCell value={sc?.categories.value_articulation.score ?? null} />
                      <ScoreCell value={sc?.categories.closing.score ?? null} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-white/20 text-sm">No sessions yet</div>
        )}
      </div>
    </div>
  )
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <td className="px-4 py-3 text-xs text-white/20">—</td>
  return (
    <td className="px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold ${scoreColor(value)}`}>{value}</span>
        <div className="w-10 h-1 bg-white/10 rounded-full">
          <div className={`h-full rounded-full ${scoreBg(value)}`} style={{ width: `${(value / 10) * 100}%` }} />
        </div>
      </div>
    </td>
  )
}

function StatCard({ label, value, highlight = '' }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
      <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold text-white ${highlight}`}>{value}</div>
    </div>
  )
}
