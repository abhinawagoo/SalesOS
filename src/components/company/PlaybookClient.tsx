'use client'

import { useState } from 'react'

interface CompanyConfig {
  icp_description: string
  must_ask_questions: string[]
  key_differentiators: string[]
  forbidden_phrases: string[]
  scoring_focus: string[]
  competitor_names: string[]
}

const EMPTY_CONFIG: CompanyConfig = {
  icp_description: '',
  must_ask_questions: [],
  key_differentiators: [],
  forbidden_phrases: [],
  scoring_focus: [],
  competitor_names: [],
}

interface Props { config: CompanyConfig | null }

export default function PlaybookClient({ config: initial }: Props) {
  const [config, setConfig] = useState<CompanyConfig>(initial ?? EMPTY_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helpers for array fields
  function addItem(field: keyof CompanyConfig, value: string) {
    if (!value.trim()) return
    setConfig(c => ({ ...c, [field]: [...(c[field] as string[]), value.trim()] }))
    setSaved(false)
  }

  function removeItem(field: keyof CompanyConfig, idx: number) {
    setConfig(c => ({ ...c, [field]: (c[field] as string[]).filter((_, i) => i !== idx) }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/company-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Playbook</h1>
          <p className="text-white/40 text-sm mt-1">Company context injected into every AI simulation and score</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Playbook'}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <span className="text-indigo-400 text-lg flex-shrink-0">◈</span>
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">How this powers your simulations</div>
          <p className="text-sm text-white/50">Your ICP, must-ask questions, and differentiators are injected into the AI buyer prompt. Forbidden phrases are flagged in scoring. Competitor names trigger objection handling checks.</p>
        </div>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="space-y-6">
        {/* ICP */}
        <Section title="Ideal Customer Profile (ICP)" description="Who do your reps sell to? The AI buyer will behave like this profile.">
          <textarea
            value={config.icp_description}
            onChange={e => { setConfig(c => ({ ...c, icp_description: e.target.value })); setSaved(false) }}
            rows={4}
            placeholder="e.g. VP of Sales at B2B SaaS companies with 50–500 employees. Using legacy CRM. Evaluating tools to improve rep productivity..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-y"
          />
        </Section>

        {/* Must-ask questions */}
        <ArraySection
          title="Must-Ask Discovery Questions"
          description="Questions reps must cover. Skipping them reduces discovery score."
          items={config.must_ask_questions}
          placeholder="e.g. What does your current sales process look like?"
          onAdd={v => addItem('must_ask_questions', v)}
          onRemove={i => removeItem('must_ask_questions', i)}
        />

        {/* Key differentiators */}
        <ArraySection
          title="Key Differentiators"
          description="Your value props. Used to coach reps on messaging quality."
          items={config.key_differentiators}
          placeholder="e.g. 3× faster onboarding than Salesforce"
          onAdd={v => addItem('key_differentiators', v)}
          onRemove={i => removeItem('key_differentiators', i)}
        />

        {/* Forbidden phrases */}
        <ArraySection
          title="Forbidden Phrases"
          description="Words/phrases that hurt deals. Flagged during scoring."
          items={config.forbidden_phrases}
          placeholder='e.g. "just checking in"'
          onAdd={v => addItem('forbidden_phrases', v)}
          onRemove={i => removeItem('forbidden_phrases', i)}
          badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
        />

        {/* Competitor names */}
        <ArraySection
          title="Competitors"
          description="Names to watch for in calls. Triggers competitive objection scoring."
          items={config.competitor_names}
          placeholder="e.g. Gong, Chorus, Clari"
          onAdd={v => addItem('competitor_names', v)}
          onRemove={i => removeItem('competitor_names', i)}
          badgeColor="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        />

        {/* Scoring focus */}
        <ArraySection
          title="Scoring Focus Areas"
          description="Custom criteria the AI evaluator will weigh more heavily."
          items={config.scoring_focus}
          placeholder="e.g. Always confirm next steps before ending call"
          onAdd={v => addItem('scoring_focus', v)}
          onRemove={i => removeItem('scoring_focus', i)}
          badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        />
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-1">{title}</h2>
      <p className="text-xs text-white/30 mb-4">{description}</p>
      {children}
    </div>
  )
}

function ArraySection({
  title, description, items, placeholder, onAdd, onRemove, badgeColor = 'bg-white/5 text-white/60 border-white/10',
}: {
  title: string
  description: string
  items: string[]
  placeholder: string
  onAdd: (v: string) => void
  onRemove: (i: number) => void
  badgeColor?: string
}) {
  const [input, setInput] = useState('')
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-1">{title}</h2>
      <p className="text-xs text-white/30 mb-4">{description}</p>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item, i) => (
            <span key={i} className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badgeColor}`}>
              {item}
              <button onClick={() => onRemove(i)} className="hover:text-white transition-colors text-[10px] leading-none">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(input); setInput('') } }}
          placeholder={placeholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
        />
        <button
          onClick={() => { onAdd(input); setInput('') }}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 text-sm px-4 py-2 rounded-xl transition-all"
        >
          Add
        </button>
      </div>
    </div>
  )
}
