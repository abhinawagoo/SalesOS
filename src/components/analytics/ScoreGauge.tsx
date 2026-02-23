'use client'

import { useEffect, useState } from 'react'

interface ScoreGaugeProps {
  score: number
  label?: string
  size?: number
}

export default function ScoreGauge({ score, label = 'Overall', size = 140 }: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  // Only fill 270° (start at -225deg, go clockwise)
  const arcLength = circumference * 0.75
  const offset = arcLength - (animated / 10) * arcLength

  function strokeColor(s: number) {
    if (s >= 8) return '#34d399' // emerald-400
    if (s >= 6) return '#facc15' // yellow-400
    return '#f87171' // red-400
  }

  const cx = size / 2
  const cy = size / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={strokeColor(score)}
            strokeWidth={10}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{ fontSize: size * 0.24, color: strokeColor(score) }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-white/30" style={{ fontSize: size * 0.09 }}>/10</span>
        </div>
      </div>
      <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
    </div>
  )
}
