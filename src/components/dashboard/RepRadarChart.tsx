'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ScoreBreakdown } from '@/lib/types'

interface RepRadarChartProps {
  scores: ScoreBreakdown
}

const LABELS: Record<keyof ScoreBreakdown, string> = {
  discovery: 'Discovery',
  objection_handling: 'Objection',
  value_articulation: 'Value',
  clarity: 'Clarity',
  closing: 'Closing',
}

export default function RepRadarChart({ scores }: RepRadarChartProps) {
  const data = (Object.keys(scores) as (keyof ScoreBreakdown)[]).map((key) => ({
    skill: LABELS[key],
    score: scores[key],
    fullMark: 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#e8e8f0',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}/10`, 'Score']}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
