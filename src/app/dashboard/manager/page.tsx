import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import Link from 'next/link'
import { Session, UserProfile } from '@/lib/types'
import { avgScores, scoreColor, scoreBg } from '@/lib/utils'

export default async function ManagerDashboard() {
  const user = await getSessionUser()
  const supabase = createAdminClient()

  const { data: teamMembers } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', user.organization_id)

  const { data: allSessions } = await supabase
    .from('sessions')
    .select('*, users(name, email)')
    .in('user_id', (teamMembers || []).map((m: UserProfile) => m.id))
    .not('scores', 'is', null)

  const repStats = (teamMembers || []).map((member: UserProfile) => {
    const repSessions = (allSessions || []).filter((s: Session) => s.user_id === member.id)
    const avgs = avgScores(repSessions)
    return { ...member, totalSessions: repSessions.length, avgs }
  })

  const completedSessions = allSessions || []
  const teamAvgs = avgScores(completedSessions)
  const underperformers = repStats.filter(r => r.avgs && r.avgs.overall < 6)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Overview</h1>
          <p className="text-white/40 text-sm mt-1">{user.organizations?.name ?? 'Your Team'}</p>
        </div>
        <Link href="/assignments" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
          + Assign Practice
        </Link>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <StatCard label="Members" value={String(teamMembers?.length || 0)} />
        <StatCard label="Simulations" value={String(completedSessions.length)} />
        <StatCard label="Overall Avg" value={teamAvgs ? `${teamAvgs.overall}` : '—'} highlight={teamAvgs ? scoreColor(teamAvgs.overall) : ''} />
        <StatCard label="Discovery" value={teamAvgs ? `${teamAvgs.discovery}` : '—'} highlight={teamAvgs ? scoreColor(teamAvgs.discovery) : ''} />
        <StatCard label="Objection" value={teamAvgs ? `${teamAvgs.objection_handling}` : '—'} highlight={teamAvgs ? scoreColor(teamAvgs.objection_handling) : ''} />
        <StatCard label="Closing" value={teamAvgs ? `${teamAvgs.closing}` : '—'} highlight={teamAvgs ? scoreColor(teamAvgs.closing) : ''} />
      </div>

      {underperformers.length > 0 && (
        <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-400 mt-0.5">⚠</span>
          <div>
            <div className="text-sm font-medium text-red-300">
              {underperformers.length} rep{underperformers.length > 1 ? 's' : ''} scoring below 6
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              {underperformers.map(r => r.name).join(', ')} — consider assigning targeted practice
            </div>
          </div>
        </div>
      )}

      {/* Rep table */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70">Rep Performance</h2>
          <span className="text-xs text-white/30">Click a rep for detailed view</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Rep', 'Sessions', 'Overall', 'Discovery', 'Objection', 'Value', 'Closing', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs text-white/30 px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repStats.map(rep => (
                <tr key={rep.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/rep/${rep.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs text-indigo-300 font-medium">
                        {rep.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-white/80 font-medium">{rep.name}</div>
                        <div className="text-xs text-white/30">{rep.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/50">{rep.totalSessions}</td>
                  <ScoreCell value={rep.avgs?.overall ?? null} />
                  <ScoreCell value={rep.avgs?.discovery ?? null} />
                  <ScoreCell value={rep.avgs?.objection_handling ?? null} />
                  <ScoreCell value={rep.avgs?.value_articulation ?? null} />
                  <ScoreCell value={rep.avgs?.closing ?? null} />
                  <td className="px-4 py-4">
                    {!rep.avgs ? (
                      <span className="text-xs bg-white/5 text-white/30 px-2 py-1 rounded-full">No data</span>
                    ) : rep.avgs.overall < 6 ? (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">Needs coaching</span>
                    ) : rep.avgs.overall < 8 ? (
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
    </div>
  )
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <td className="px-4 py-4 text-xs text-white/20">—</td>
  return (
    <td className="px-4 py-4">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${scoreColor(value)}`}>{value}</span>
        <div className="w-12 h-1 bg-white/10 rounded-full">
          <div className={`h-full rounded-full ${scoreBg(value)}`} style={{ width: `${(value/10)*100}%` }} />
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
