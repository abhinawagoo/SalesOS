import { createAdminClient } from '@/lib/supabase/admin'
import { DEMO_USER } from '@/lib/demo'
import { Session } from '@/lib/types'
import { avgScores, formatDate, scoreColor } from '@/lib/utils'
import ScoreGauge from '@/components/analytics/ScoreGauge'
import SkillBarChart from '@/components/analytics/SkillBarChart'
import ScoreProgressionChart from '@/components/dashboard/ScoreProgressionChart'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const supabase = createAdminClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, personas(title, industry, difficulty)')
    .eq('user_id', DEMO_USER.id)
    .order('created_at', { ascending: true })

  const allSessions: Session[] = sessions || []
  const completed = allSessions.filter(s => s.scores !== null)
  const avgs = avgScores(allSessions)

  const totalSessions = allSessions.length
  const conversionRate = completed.length > 0
    ? Math.round((completed.filter(s => (s.scores?.overall_score ?? 0) >= 7).length / completed.length) * 100)
    : 0

  // Weakest skill label
  const weakestSkill = avgs ? (() => {
    const skills = {
      Discovery: avgs.discovery,
      Objection: avgs.objection_handling,
      Value: avgs.value_articulation,
      Closing: avgs.closing,
    }
    return Object.entries(skills).reduce((a, b) => a[1] < b[1] ? a : b)[0]
  })() : '—'

  // Progression data (chronological)
  const progressionData = completed.map(s => ({
    date: formatDate(s.created_at),
    overall: s.scores!.overall_score,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Performance overview for {DEMO_USER.name}</p>
        </div>
        <Link
          href="/simulate"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          + New Roleplay
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Sessions" value={String(totalSessions)} />
        <StatCard
          label="Avg Score"
          value={avgs ? `${avgs.overall}` : '—'}
          sub={avgs ? '/10' : ''}
          highlight={avgs ? scoreColor(avgs.overall) : ''}
        />
        <StatCard label="Conversion Rate" value={completed.length > 0 ? `${conversionRate}%` : '—'} sub={completed.length > 0 ? ' ≥7' : ''} />
        <StatCard label="Weakest Skill" value={weakestSkill} valueSmall />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gauge */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-xs text-white/40 uppercase tracking-wider mb-6">Overall Average</h2>
          {avgs ? (
            <ScoreGauge score={avgs.overall} label="Overall" size={160} />
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm text-center px-4">
              Complete sessions to see your score
            </div>
          )}
        </div>

        {/* Skill bar chart */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Skill Averages</h2>
          {avgs ? (
            <SkillBarChart
              discovery={avgs.discovery}
              objection_handling={avgs.objection_handling}
              value_articulation={avgs.value_articulation}
              closing={avgs.closing}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Progression chart */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
        <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Score Progression</h2>
        <ScoreProgressionChart data={progressionData} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub = '',
  highlight = '',
  valueSmall = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: string
  valueSmall?: boolean
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
      <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`font-bold text-white ${highlight} ${valueSmall ? 'text-base mt-1' : 'text-xl'}`}>
        {value}
        {sub && <span className="text-white/30 text-xs font-normal">{sub}</span>}
      </div>
    </div>
  )
}
