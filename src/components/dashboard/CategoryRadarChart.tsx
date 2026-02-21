'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface CategoryRadarChartProps {
  scores: {
    discovery: number
    objection_handling: number
    value_articulation: number
    closing: number
  }
}

export default function CategoryRadarChart({ scores }: CategoryRadarChartProps) {
  const data = [
    { skill: 'Discovery', score: scores.discovery },
    { skill: 'Objection', score: scores.objection_handling },
    { skill: 'Value', score: scores.value_articulation },
    { skill: 'Closing', score: scores.closing },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#e8e8f0' }}
          formatter={(value: number | undefined) => [`${value ?? 0}/10`, 'Score']}
        />
        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
