import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SessionScore } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOverallScore(score: SessionScore): number {
  return score.overall_score
}

export function getCategoryScores(score: SessionScore) {
  return {
    discovery: score.categories.discovery.score,
    objection_handling: score.categories.objection_handling.score,
    value_articulation: score.categories.value_articulation.score,
    closing: score.categories.closing.score,
  }
}

export function getWeakestCategory(score: SessionScore): string {
  const labels = {
    discovery: 'Discovery',
    objection_handling: 'Objection Handling',
    value_articulation: 'Value Articulation',
    closing: 'Closing',
  }
  const cats = getCategoryScores(score)
  const min = Object.entries(cats).reduce((a, b) => a[1] < b[1] ? a : b)
  return labels[min[0] as keyof typeof labels]
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

export function scoreBgFull(score: number): string {
  if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  if (score >= 6) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
  return 'bg-red-500/10 border-red-500/20 text-red-400'
}

export function avgScores(sessions: { scores: SessionScore | null }[]) {
  const completed = sessions.filter(s => s.scores !== null)
  if (completed.length === 0) return null

  const avg = (vals: number[]) =>
    Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10

  return {
    overall: avg(completed.map(s => s.scores!.overall_score)),
    discovery: avg(completed.map(s => s.scores!.categories.discovery.score)),
    objection_handling: avg(completed.map(s => s.scores!.categories.objection_handling.score)),
    value_articulation: avg(completed.map(s => s.scores!.categories.value_articulation.score)),
    closing: avg(completed.map(s => s.scores!.categories.closing.score)),
  }
}
