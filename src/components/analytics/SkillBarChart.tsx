'use client'

import { BarChart, Bar, XAxis, YAxis, Cell, LabelList, ResponsiveContainer, Tooltip } from 'recharts'

interface SkillBarChartProps {
  discovery: number
  objection_handling: number
  value_articulation: number
  closing: number
}

function barColor(v: number) {
  if (v >= 8) return '#34d399'
  if (v >= 6) return '#facc15'
  return '#f87171'
}

export default function SkillBarChart({ discovery, objection_handling, value_articulation, closing }: SkillBarChartProps) {
  const data = [
    { name: 'Discovery', value: discovery },
    { name: 'Objection', value: objection_handling },
    { name: 'Value', value: value_articulation },
    { name: 'Closing', value: closing },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" domain={[0, 10]} hide />
        <YAxis type="category" dataKey="name" width={72} tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{ background: '#12121f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#fff' }}
          formatter={(v: number | undefined) => [`${v ?? 0}/10`, 'Score']}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={barColor(entry.value)} fillOpacity={0.85} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => `${v ?? ''}`}
            style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
