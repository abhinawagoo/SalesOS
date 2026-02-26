'use client'

import { useState } from 'react'
import { UserProfile, Session } from '@/lib/types'
import { scoreColor, avgScores, cn } from '@/lib/utils'
import Link from 'next/link'

interface TeamClientProps {
  reps: UserProfile[]
  sessionsByRep: Record<string, Session[]>
}

export default function TeamClient({ reps: initialReps, sessionsByRep }: TeamClientProps) {
  const [reps, setReps] = useState<UserProfile[]>(initialReps)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setSaving(false)
      return
    }

    setReps(prev => [data.rep, ...prev])
    setForm({ name: '', email: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this rep from your team?')) return
    setRemoving(id)

    const res = await fetch('/api/reps', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()

    if (data.success) {
      setReps(prev => prev.filter(r => r.id !== id))
    }
    setRemoving(null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-white/40 text-sm mt-1">{reps.length} rep{reps.length !== 1 ? 's' : ''} in your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/assignments"
            className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-xl transition-all"
          >
            Manage Assignments
          </Link>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              + Add Rep
            </button>
          )}
        </div>
      </div>

      {/* Add rep form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/80 mb-4">Add Rep to Team</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Chen"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="e.g. sarah@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Adding...' : 'Add Rep'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null) }}
                className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rep list */}
      {reps.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl h-48 flex flex-col items-center justify-center gap-3">
          <div className="text-white/20 text-sm">No reps on your team yet</div>
          <button
            onClick={() => setShowForm(true)}
            className="text-indigo-400 text-xs hover:text-indigo-300"
          >
            Add your first rep →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {reps.map((rep) => {
            const repSessions = sessionsByRep[rep.id] || []
            const avgs = avgScores(repSessions)
            const completedCount = repSessions.filter(s => s.scores !== null).length

            return (
              <div key={rep.id} className="bg-white/[0.03] border border-white/8 rounded-xl px-5 py-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-sm font-semibold text-indigo-300 flex-shrink-0">
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{rep.name}</div>
                    <div className="text-xs text-white/30 mt-0.5">{rep.email}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-white/30 mb-0.5">Sessions</div>
                    <div className="text-sm font-semibold text-white">{completedCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/30 mb-0.5">Avg Score</div>
                    <div className={cn('text-sm font-semibold', avgs ? scoreColor(avgs.overall) : 'text-white/20')}>
                      {avgs ? avgs.overall : '—'}
                    </div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-xs text-white/30 mb-0.5">Best Skill</div>
                    <div className="text-xs text-white/50">
                      {avgs ? getBestSkill(avgs) : '—'}
                    </div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-xs text-white/30 mb-0.5">Focus Area</div>
                    <div className="text-xs text-red-400/70">
                      {avgs ? getWeakestSkill(avgs) : '—'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-2">
                    <Link
                      href={`/assignments?rep=${rep.id}`}
                      className="text-xs text-indigo-400/70 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-600/10 transition-all"
                    >
                      Assign
                    </Link>
                    <button
                      onClick={() => handleRemove(rep.id)}
                      disabled={removing === rep.id}
                      className="text-xs text-white/20 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-30"
                    >
                      {removing === rep.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Avgs = { discovery: number; objection_handling: number; value_articulation: number; closing: number }

const SKILL_LABELS: Record<keyof Avgs, string> = {
  discovery: 'Discovery',
  objection_handling: 'Objection',
  value_articulation: 'Value',
  closing: 'Closing',
}

function getBestSkill(avgs: Avgs): string {
  const max = Object.entries(avgs).reduce((a, b) => a[1] > b[1] ? a : b)
  return SKILL_LABELS[max[0] as keyof Avgs]
}

function getWeakestSkill(avgs: Avgs): string {
  const min = Object.entries(avgs).reduce((a, b) => a[1] < b[1] ? a : b)
  return SKILL_LABELS[min[0] as keyof Avgs]
}
