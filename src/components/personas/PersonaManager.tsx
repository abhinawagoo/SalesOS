'use client'

import { useState } from 'react'
import { Persona } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface PersonaManagerProps {
  personas: Persona[]
  organizationId: string
}

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  hard: 'bg-red-500/10 text-red-400',
}

export default function PersonaManager({ personas, organizationId }: PersonaManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    industry: '',
    buyer_role: '',
    difficulty: 'medium' as Persona['difficulty'],
    personality_traits: '',
    objection_style: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        personality_traits: form.personality_traits.split(',').map((t) => t.trim()).filter(Boolean),
        organization_id: organizationId,
      }),
    })

    if (res.ok) {
      setShowForm(false)
      setForm({ title: '', industry: '', buyer_role: '', difficulty: 'medium', personality_traits: '', objection_style: '' })
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Buyer Personas</h1>
          <p className="text-white/40 text-sm mt-1">Manage simulation personas for your team</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Persona'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">New Persona</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Skeptical CFO"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Industry</label>
              <input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                required
                placeholder="Enterprise SaaS"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Buyer Role</label>
              <input
                value={form.buyer_role}
                onChange={(e) => setForm({ ...form, buyer_role: e.target.value })}
                required
                placeholder="Chief Financial Officer"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Persona['difficulty'] })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="easy" className="bg-[#1a1a2e]">Easy</option>
                <option value="medium" className="bg-[#1a1a2e]">Medium</option>
                <option value="hard" className="bg-[#1a1a2e]">Hard</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/40 mb-1.5">Personality Traits (comma-separated)</label>
              <input
                value={form.personality_traits}
                onChange={(e) => setForm({ ...form, personality_traits: e.target.value })}
                placeholder="analytical, cost-focused, risk-averse"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/40 mb-1.5">Objection Style</label>
              <textarea
                value={form.objection_style}
                onChange={(e) => setForm({ ...form, objection_style: e.target.value })}
                required
                rows={2}
                placeholder="Challenges ROI immediately, demands hard numbers, brings up budget constraints"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
              >
                {saving ? 'Creating...' : 'Create Persona'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Persona list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((persona) => (
          <div key={persona.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-sm">
                {persona.buyer_role.charAt(0)}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', DIFFICULTY_COLORS[persona.difficulty])}>
                  {persona.difficulty}
                </span>
                {persona.organization_id === null && (
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">Default</span>
                )}
              </div>
            </div>
            <div className="text-sm font-semibold text-white mb-1">{persona.title}</div>
            <div className="text-xs text-white/40 mb-3">{persona.buyer_role} · {persona.industry}</div>
            <p className="text-xs text-white/30 leading-relaxed">{persona.objection_style}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {persona.personality_traits?.map((trait) => (
                <span key={trait} className="text-[10px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full">{trait}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
