import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import Link from 'next/link'
import { Session, SCENARIO_LABELS } from '@/lib/types'
import { avgScores, formatDate, scoreColor, scoreBg } from '@/lib/utils'
import CategoryRadarChart from '@/components/dashboard/CategoryRadarChart'

export default async function RepDashboard() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, personas(title, industry, difficulty)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const avgs = avgScores(sessions || [])
  const totalSessions = sessions?.length || 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {user.name}</p>
        </div>
        <Link href="/simulate" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors glow-blue">
          + New Simulation
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <StatCard label="Sessions" value={String(totalSessions)} />
        <StatCard label="Overall" value={avgs ? `${avgs.overall}` : '—'} highlight={avgs ? scoreColor(avgs.overall) : ''} />
        <StatCard label="Discovery" value={avgs ? `${avgs.discovery}` : '—'} highlight={avgs ? scoreColor(avgs.discovery) : ''} sub="/10" />
        <StatCard label="Objection" value={avgs ? `${avgs.objection_handling}` : '—'} highlight={avgs ? scoreColor(avgs.objection_handling) : ''} sub="/10" />
        <StatCard label="Value" value={avgs ? `${avgs.value_articulation}` : '—'} highlight={avgs ? scoreColor(avgs.value_articulation) : ''} sub="/10" />
        <StatCard label="Closing" value={avgs ? `${avgs.closing}` : '—'} highlight={avgs ? scoreColor(avgs.closing) : ''} sub="/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Radar */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Skill Breakdown</h2>
          {avgs ? (
            <CategoryRadarChart scores={{
              discovery: avgs.discovery,
              objection_handling: avgs.objection_handling,
              value_articulation: avgs.value_articulation,
              closing: avgs.closing,
            }} />
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm text-center px-4">
              Complete a simulation to see your skill breakdown
            </div>
          )}
        </div>

        {/* Session history */}
        <div className="lg:col-span-3 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Session History</h2>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {sessions.slice(0, 15).map((s: Session & { personas: { title: string; industry: string; difficulty: string } }) => {
                const overall = s.scores?.overall_score ?? null
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <div>
                      <div className="text-sm text-white/80 font-medium">{s.personas?.title}</div>
                      <div className="text-xs text-white/30 mt-0.5 flex items-center gap-1.5">
                        <span>{SCENARIO_LABELS[s.scenario_type as keyof typeof SCENARIO_LABELS] ?? 'Discovery'}</span>
                        <span>·</span>
                        <span>{formatDate(s.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {overall !== null ? (
                        <>
                          <span className={`text-sm font-bold ${scoreColor(overall)}`}>{overall}</span>
                          <span className="text-white/20 text-xs">/10</span>
                        </>
                      ) : (
                        <span className="text-xs text-white/20">In progress</span>
                      )}
                      <div className={`text-[10px] mt-0.5 capitalize ${
                        s.personas?.difficulty === 'hard' ? 'text-red-400/60' :
                        s.personas?.difficulty === 'medium' ? 'text-yellow-400/60' : 'text-emerald-400/60'
                      }`}>{s.personas?.difficulty}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="text-white/20 text-sm">No sessions yet</div>
              <Link href="/simulate" className="text-indigo-400 text-xs hover:text-indigo-300">Start your first simulation →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight = '', sub = '' }: { label: string; value: string; highlight?: string; sub?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
      <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold text-white ${highlight}`}>
        {value}<span className="text-white/30 text-xs font-normal">{sub}</span>
      </div>
    </div>
  )
}
