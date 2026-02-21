import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Session, UserProfile } from '@/lib/types'
import { getOverallScore, getWeakestSkill, scoreColor, scoreBg } from '@/lib/utils'

export default async function ManagerDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') redirect('/dashboard/rep')

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', profile.organization_id)

  // Get all sessions for the org
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('*, users(name, email)')
    .in('user_id', (teamMembers || []).map((m: UserProfile) => m.id))
    .not('scores', 'is', null)

  // Compute per-rep stats
  const repStats = (teamMembers || []).map((member: UserProfile) => {
    const repSessions = (allSessions || []).filter((s: Session) => s.user_id === member.id)
    if (repSessions.length === 0) {
      return { ...member, totalSessions: 0, avgScore: null, weakestSkill: null }
    }

    const avgScores = {
      discovery: avg(repSessions.map((s: Session) => s.scores!.scores.discovery)),
      objection_handling: avg(repSessions.map((s: Session) => s.scores!.scores.objection_handling)),
      value_articulation: avg(repSessions.map((s: Session) => s.scores!.scores.value_articulation)),
      clarity: avg(repSessions.map((s: Session) => s.scores!.scores.clarity)),
      closing: avg(repSessions.map((s: Session) => s.scores!.scores.closing)),
    }

    return {
      ...member,
      totalSessions: repSessions.length,
      avgScore: getOverallScore(avgScores),
      weakestSkill: getWeakestSkill(avgScores),
    }
  })

  // Team-wide stats
  const totalSimulations = allSessions?.length || 0
  const repsWithSessions = repStats.filter((r) => r.avgScore !== null)
  const teamAvg = repsWithSessions.length > 0
    ? Math.round(repsWithSessions.reduce((a, b) => a + (b.avgScore || 0), 0) / repsWithSessions.length * 10) / 10
    : null

  // Weakest skill across team
  const skillTotals = { discovery: 0, objection_handling: 0, value_articulation: 0, clarity: 0, closing: 0 }
  const completedSessions = allSessions || []
  if (completedSessions.length > 0) {
    completedSessions.forEach((s: Session) => {
      Object.keys(skillTotals).forEach((k) => {
        skillTotals[k as keyof typeof skillTotals] += s.scores!.scores[k as keyof typeof skillTotals]
      })
    })
    Object.keys(skillTotals).forEach((k) => {
      skillTotals[k as keyof typeof skillTotals] /= completedSessions.length
    })
  }

  const teamWeakestSkill = completedSessions.length > 0 ? getWeakestSkill(skillTotals) : null
  const underperformers = repStats.filter((r) => r.avgScore !== null && r.avgScore < 6)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Team Overview</h1>
        <p className="text-white/40 text-sm mt-1">{profile.organizations?.name}</p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Team Members" value={String(teamMembers?.length || 0)} />
        <StatCard label="Total Simulations" value={String(totalSimulations)} />
        <StatCard
          label="Team Avg Score"
          value={teamAvg !== null ? `${teamAvg}/10` : '—'}
          highlight={teamAvg !== null ? scoreColor(teamAvg) : ''}
        />
        <StatCard
          label="Weakest Skill"
          value={teamWeakestSkill || '—'}
          small
          highlight="text-red-400"
        />
      </div>

      {/* Underperformers alert */}
      {underperformers.length > 0 && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-red-400 mt-0.5">⚠</span>
          <div>
            <div className="text-sm font-medium text-red-300">
              {underperformers.length} rep{underperformers.length > 1 ? 's' : ''} scoring below 6
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              {underperformers.map((r) => r.name).join(', ')} — consider additional coaching
            </div>
          </div>
        </div>
      )}

      {/* Team table */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white/70">Rep Performance</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Rep', 'Sessions', 'Avg Score', 'Weakest Skill', 'Status'].map((h) => (
                <th key={h} className="text-left text-xs text-white/30 px-6 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repStats.map((rep) => (
              <tr key={rep.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs text-indigo-300 font-medium">
                      {rep.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-white/80 font-medium">{rep.name}</div>
                      <div className="text-xs text-white/30">{rep.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/60">{rep.totalSessions}</td>
                <td className="px-6 py-4">
                  {rep.avgScore !== null ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreColor(rep.avgScore)}`}>{rep.avgScore}/10</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-16">
                        <div
                          className={`h-full rounded-full ${scoreBg(rep.avgScore)}`}
                          style={{ width: `${(rep.avgScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-white/20">No data</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-white/40">{rep.weakestSkill || '—'}</td>
                <td className="px-6 py-4">
                  {rep.avgScore === null ? (
                    <span className="text-xs bg-white/5 text-white/30 px-2 py-1 rounded-full">No sessions</span>
                  ) : rep.avgScore < 6 ? (
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">Needs coaching</span>
                  ) : rep.avgScore < 8 ? (
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full">Developing</span>
                  ) : (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">Strong</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 10) / 10
}

function StatCard({ label, value, highlight = '', small = false }: {
  label: string
  value: string
  highlight?: string
  small?: boolean
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
      <div className="text-xs text-white/40 mb-2">{label}</div>
      <div className={`font-bold text-white ${small ? 'text-base' : 'text-2xl'} ${highlight}`}>{value}</div>
    </div>
  )
}
