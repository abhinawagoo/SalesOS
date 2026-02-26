'use client'

import { useState } from 'react'

interface Candidate {
  id: string
  name: string
  email: string
  role_applied: string
  status: string
  overall_score: number | null
  created_at: string
  assessment_token: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  invited:     { label: 'Invited',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  completed:   { label: 'Completed',   color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  hired:       { label: 'Hired',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected:    { label: 'Rejected',    color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

interface Props { candidates: Candidate[] }

export default function HiringClient({ candidates: initialCandidates }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role_applied: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/hiring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setCandidates(prev => [data.candidate, ...prev])
    setForm({ name: '', email: '', role_applied: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    const res = await fetch('/api/hiring', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const data = await res.json()
    if (!data.error) {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    }
    setUpdatingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this candidate?')) return
    await fetch('/api/hiring', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const assessmentLink = (token: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/assess/${token}` : `/assess/${token}`

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Hiring Assessment</h1>
          <p className="text-white/40 text-sm mt-1">Invite candidates to complete a real sales simulation before hiring</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          + Invite Candidate
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <span className="text-indigo-400 text-lg flex-shrink-0">◉</span>
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">How hiring assessments work</div>
          <p className="text-sm text-white/50">Each candidate gets a unique link to complete a voice roleplay simulation. They need no account — just the link. You see their score and full transcript instantly. Hire the best performer, skip the guesswork.</p>
        </div>
      </div>

      {/* Invite form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/80 mb-5">Invite Candidate</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Jane Smith"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="jane@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Role Applied</label>
                <input
                  value={form.role_applied}
                  onChange={e => setForm(f => ({ ...f, role_applied: e.target.value }))}
                  placeholder="Enterprise AE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                {saving ? 'Creating...' : 'Create Assessment Link'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="border border-white/10 text-white/50 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Invited" value={String(candidates.length)} />
          <StatCard label="Completed" value={String(candidates.filter(c => ['completed','hired','rejected'].includes(c.status)).length)} />
          <StatCard label="Hired" value={String(candidates.filter(c => c.status === 'hired').length)} />
          <StatCard
            label="Avg Score"
            value={(() => {
              const scored = candidates.filter(c => c.overall_score !== null)
              if (!scored.length) return '—'
              return (scored.reduce((s, c) => s + (c.overall_score ?? 0), 0) / scored.length).toFixed(1)
            })()}
          />
        </div>
      )}

      {/* Candidates list */}
      {candidates.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl h-48 flex flex-col items-center justify-center gap-3">
          <div className="text-4xl">👤</div>
          <div className="text-white/30 text-sm">No candidates yet</div>
          <button onClick={() => setShowForm(true)} className="text-indigo-400 text-xs hover:text-indigo-300">Invite your first candidate →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map(c => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.invited
            return (
              <div key={c.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-white">{c.name}</span>
                      <span className="text-xs text-white/30">{c.email}</span>
                      {c.role_applied && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">{c.role_applied}</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
                      {c.overall_score !== null && (
                        <span className="text-xs font-semibold text-indigo-300">{c.overall_score.toFixed(1)}/10</span>
                      )}
                    </div>

                    {/* Assessment link */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-white/20">Assessment link:</span>
                      <input
                        readOnly
                        value={assessmentLink(c.assessment_token)}
                        className="flex-1 bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-[10px] text-white/40 font-mono cursor-text"
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(assessmentLink(c.assessment_token))}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={c.status}
                      onChange={e => updateStatus(c.id, e.target.value)}
                      disabled={updatingId === c.id}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/60 focus:outline-none focus:border-indigo-500/50 disabled:opacity-40"
                    >
                      {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                        <option key={val} value={val} className="bg-[#1a1a2e]">{cfg.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-white/20 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      ✕
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
      <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  )
}
