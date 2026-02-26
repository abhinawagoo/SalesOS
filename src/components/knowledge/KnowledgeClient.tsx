'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface KnowledgeItem {
  id: string
  title: string
  item_type: string
  content: string
  created_at: string
}

const ITEM_TYPES = [
  { value: 'product_doc',  label: 'Product Doc',     color: 'bg-indigo-500/10 text-indigo-400',  icon: '📄' },
  { value: 'transcript',   label: 'Call Transcript',  color: 'bg-blue-500/10 text-blue-400',      icon: '📞' },
  { value: 'objection',    label: 'Objection Library',color: 'bg-yellow-500/10 text-yellow-400',  icon: '🛡' },
  { value: 'battlecard',   label: 'Battlecard',       color: 'bg-red-500/10 text-red-400',        icon: '⚔️' },
  { value: 'pricing',      label: 'Pricing Sheet',    color: 'bg-emerald-500/10 text-emerald-400',icon: '💰' },
  { value: 'case_study',   label: 'Case Study',       color: 'bg-purple-500/10 text-purple-400',  icon: '🏆' },
  { value: 'playbook',     label: 'Sales Playbook',   color: 'bg-orange-500/10 text-orange-400',  icon: '📋' },
]

function typeInfo(type: string) {
  return ITEM_TYPES.find(t => t.value === type) ?? ITEM_TYPES[0]
}

interface Props { items: KnowledgeItem[] }

export default function KnowledgeClient({ items: initialItems }: Props) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState({ title: '', content: '', item_type: 'product_doc' })
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/knowledge', {
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
    setItems(prev => [data.item, ...prev])
    setForm({ title: '', content: '', item_type: 'product_doc' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item from your knowledge base?')) return
    setDeleting(id)
    await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleting(null)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(f => ({ ...f, content: (ev.target?.result as string) || '', title: f.title || file.name.replace(/\.[^.]+$/, '') }))
    }
    reader.readAsText(file)
  }

  const filtered = filterType === 'all' ? items : items.filter(i => i.item_type === filterType)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-white/40 text-sm mt-1">Company context that powers AI-aware simulations and scoring</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          + Add Knowledge
        </button>
      </div>

      {/* How it works banner */}
      <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
        <span className="text-indigo-400 text-lg flex-shrink-0">◈</span>
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">How this powers your simulations</div>
          <p className="text-sm text-white/50">Everything you upload is chunked, embedded into a vector database, and retrieved during roleplay calls and scoring. Your AI buyers will raise objections from your actual battlecards. Your scores will reflect your company&apos;s messaging.</p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/80 mb-5">Add Knowledge Item</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="e.g. Q4 Pricing Sheet"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Type</label>
                <select
                  value={form.item_type}
                  onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                  {ITEM_TYPES.map(t => (
                    <option key={t.value} value={t.value} className="bg-[#1a1a2e]">{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Upload file (optional)</label>
              <input
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleFileUpload}
                className="text-xs text-white/40 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-white/60 hover:file:bg-white/15 transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                rows={8}
                placeholder="Paste your document, transcript, objection list, or any company context here..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 resize-y font-mono"
              />
              <div className="text-[10px] text-white/20 mt-1 text-right">
                ~{Math.ceil(form.content.split(/\s+/).filter(Boolean).length / 350)} chunks will be embedded
              </div>
            </div>

            {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                {saving ? 'Embedding...' : 'Add & Embed'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="border border-white/10 text-white/50 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        <button onClick={() => setFilterType('all')} className={cn('text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all', filterType === 'all' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60')}>
          All ({items.length})
        </button>
        {ITEM_TYPES.map(t => {
          const count = items.filter(i => i.item_type === t.value).length
          if (count === 0) return null
          return (
            <button key={t.value} onClick={() => setFilterType(t.value)} className={cn('text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all', filterType === t.value ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60')}>
              {t.icon} {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl h-48 flex flex-col items-center justify-center gap-3">
          <div className="text-4xl">📚</div>
          <div className="text-white/30 text-sm">No knowledge items yet</div>
          <button onClick={() => setShowForm(true)} className="text-indigo-400 text-xs hover:text-indigo-300">Add your first document →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const meta = typeInfo(item.item_type)
            const isExpanded = expandedId === item.id
            return (
              <div key={item.id} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{item.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full', meta.color)}>{meta.label}</span>
                        <span className="text-[10px] text-white/20">
                          ~{Math.ceil(item.content.split(/\s+/).length / 350)} chunks · {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs text-white/30 hover:text-white/60 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-white/20 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      {deleting === item.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-white/5 px-5 py-4">
                    <pre className="text-xs text-white/40 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                      {item.content.slice(0, 1500)}{item.content.length > 1500 ? '\n...' : ''}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
