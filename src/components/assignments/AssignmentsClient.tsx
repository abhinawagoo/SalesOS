'use client'

import { useState } from 'react'
import { Persona, UserProfile, Assignment, ScenarioType, SCENARIO_LABELS, AssignmentStatus } from '@/lib/types'
import { cn, formatDate, scoreColor } from '@/lib/utils'

interface Props {
  teamMembers: UserProfile[]
  personas: Persona[]
  managed: Assignment[]
}

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
}

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function AssignmentsClient({ teamMembers, personas, managed: initialManaged }: Props) {
  const [managed, setManaged] = useState<Assignment[]>(initialManaged)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    rep_id: teamMembers[0]?.id ?? '',
    persona_id: personas[0]?.id ?? '',
    scenario_type: 'discovery' as ScenarioType,
    due_date: '',
    manager_comment: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.rep_id || !form.persona_id) return
    setSaving(true)

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rep_id: form.rep_id,
        persona_id: form.persona_id,
        scenario_type: form.scenario_type,
        due_date: form.due_date || null,
      }),
    })
    const data = await res.json()
    if (data.assignment) {
      setManaged(prev => [data.assignment, ...prev])
      setCreating(false)
      setForm({ rep_id: teamMembers[0]?.id ?? '', persona_id: personas[0]?.id ?? '', scenario_type: 'discovery', due_date: '', manager_comment: '' })
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Assignments</h1>
          <p className="text-white/40 text-sm mt-1">Assign targeted practice to your reps</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            + New Assignment
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/80 mb-5">New Assignment</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Assign to Rep</label>
                <select
                  value={form.rep_id}
                  onChange={e => setForm(f => ({ ...f, rep_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a2e]">{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Scenario Type</label>
                <select
                  value={form.scenario_type}
                  onChange={e => setForm(f => ({ ...f, scenario_type: e.target.value as ScenarioType }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                  {(Object.keys(SCENARIO_LABELS) as ScenarioType[]).map(t => (
                    <option key={t} value={t} className="bg-[#1a1a2e]">{SCENARIO_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Persona / Buyer</label>
                <select
                  value={form.persona_id}
                  onChange={e => setForm(f => ({ ...f, persona_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                  {personas.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#1a1a2e]">{p.title} · {p.difficulty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">Due Date (optional)</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Creating...' : 'Create Assignment'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="border border-white/10 hover:border-white/20 text-white/50 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments table */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70">Assigned Practice</h2>
          <span className="text-xs text-white/30">{managed.length} assignment{managed.length !== 1 ? 's' : ''}</span>
        </div>

        {managed.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2">
            <div className="text-white/20 text-sm">No assignments yet</div>
            <button onClick={() => setCreating(true)} className="text-indigo-400 text-xs hover:text-indigo-300">
              Create your first assignment →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Rep', 'Scenario', 'Persona', 'Due Date', 'Status', 'Score'].map(h => (
                    <th key={h} className="text-left text-xs text-white/30 px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {managed.map((a: Assignment & { personas?: Persona; rep?: UserProfile }) => {
                  const score = a.sessions?.scores?.overall_score ?? null
                  return (
                    <tr key={a.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm text-white/80">{a.rep?.name ?? 'Unknown'}</div>
                        <div className="text-xs text-white/30">{a.rep?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-white/50 whitespace-nowrap">
                        {SCENARIO_LABELS[a.scenario_type]}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-white/60">{a.personas?.title ?? '—'}</div>
                        <div className={cn('text-[10px] capitalize', {
                          'text-red-400/60': a.personas?.difficulty === 'hard',
                          'text-yellow-400/60': a.personas?.difficulty === 'medium',
                          'text-emerald-400/60': a.personas?.difficulty === 'easy',
                        })}>{a.personas?.difficulty}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-white/40 whitespace-nowrap">
                        {a.due_date ? formatDate(a.due_date) : <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('text-xs px-2 py-1 rounded-full', STATUS_STYLES[a.status])}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {score !== null ? (
                          <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}<span className="text-white/20 text-xs font-normal">/10</span></span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
