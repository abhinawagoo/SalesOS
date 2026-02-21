import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ScoreBreakdown } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOverallScore(scores: ScoreBreakdown): number {
  const values = Object.values(scores)
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10
}

export function getWeakestSkill(scores: ScoreBreakdown): string {
  const labels: Record<keyof ScoreBreakdown, string> = {
    discovery: 'Discovery',
    objection_handling: 'Objection Handling',
    value_articulation: 'Value Articulation',
    clarity: 'Clarity',
    closing: 'Closing',
  }
  const min = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)
  return labels[min[0] as keyof ScoreBreakdown]
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-yellow-400'
  return 'text-red-400'
}

export function scoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-400'
  if (score >= 6) return 'bg-yellow-400'
  return 'bg-red-400'
}
