'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; overall: number }[]
}

export default function ScoreProgressionChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-white/20 text-sm text-center px-4">
        Complete more sessions to see score progression
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#e8e8f0' }}
          formatter={(value: number | undefined) => [`${value ?? 0}/10`, 'Overall']}
        />
        <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
