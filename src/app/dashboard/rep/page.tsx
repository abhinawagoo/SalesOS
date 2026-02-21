import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import Link from 'next/link'
import { Session } from '@/lib/types'
import { getOverallScore, getWeakestSkill, formatDate, scoreColor } from '@/lib/utils'
import RepRadarChart from '@/components/dashboard/RepRadarChart'

export default async function RepDashboard() {
  const supabase = createAdminClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, personas(title, industry, difficulty)')
    .eq('user_id', DEMO_USER.id)
    .order('created_at', { ascending: false })

  const completedSessions = (sessions || []).filter((s: Session) => s.scores !== null)
  const totalSessions = sessions?.length || 0

  const avgScores = completedSessions.length > 0
    ? {
        discovery: avg(completedSessions.map((s: Session) => s.scores!.scores.discovery)),
        objection_handling: avg(completedSessions.map((s: Session) => s.scores!.scores.objection_handling)),
        value_articulation: avg(completedSessions.map((s: Session) => s.scores!.scores.value_articulation)),
        clarity: avg(completedSessions.map((s: Session) => s.scores!.scores.clarity)),
        closing: avg(completedSessions.map((s: Session) => s.scores!.scores.closing)),
      }
    : null

  const avgOverall = avgScores ? getOverallScore(avgScores) : null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {DEMO_USER.name}</p>
        </div>
        <Link
          href="/simulate"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors glow-blue"
        >
          + New Simulation
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sessions" value={String(totalSessions)} />
        <StatCard label="Completed" value={String(completedSessions.length)} />
        <StatCard
          label="Avg Score"
          value={avgOverall !== null ? `${avgOverall}/10` : '—'}
          highlight={avgOverall !== null ? scoreColor(avgOverall) : ''}
        />
        <StatCard
          label="Weakest Skill"
          value={avgScores ? getWeakestSkill(avgScores) : '—'}
          small
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Skill Breakdown</h2>
          {avgScores ? (
            <RepRadarChart scores={avgScores} />
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">
              Complete a simulation to see your skill breakdown
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Session History</h2>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sessions.slice(0, 10).map((session: Session & { personas: { title: string; industry: string; difficulty: string } }) => {
                const overall = session.scores ? getOverallScore(session.scores.scores) : null
                return (
                  <div key={session.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/5">
                    <div>
                      <div className="text-sm text-white/80 font-medium">{session.personas?.title}</div>
                      <div className="text-xs text-white/30 mt-0.5">{session.personas?.industry} · {formatDate(session.created_at)}</div>
                    </div>
                    <div className="text-right">
                      {overall !== null ? (
                        <span className={`text-sm font-bold ${scoreColor(overall)}`}>{overall}/10</span>
                      ) : (
                        <span className="text-xs text-white/20">In progress</span>
                      )}
                      <div className={`text-[10px] mt-0.5 capitalize ${
                        session.personas?.difficulty === 'hard' ? 'text-red-400/60' :
                        session.personas?.difficulty === 'medium' ? 'text-yellow-400/60' : 'text-emerald-400/60'
                      }`}>{session.personas?.difficulty}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="text-white/20 text-sm">No sessions yet</div>
              <Link href="/simulate" className="text-indigo-400 text-xs hover:text-indigo-300">
                Start your first simulation →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 10) / 10
}

function StatCard({ label, value, highlight = '', small = false }: {
  label: string; value: string; highlight?: string; small?: boolean
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
      <div className="text-xs text-white/40 mb-2">{label}</div>
      <div className={`font-bold text-white ${small ? 'text-base' : 'text-2xl'} ${highlight}`}>{value}</div>
    </div>
  )
}
