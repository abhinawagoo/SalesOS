'use client'

import { useState, useEffect } from 'react'
import { VOICE_OPTIONS } from '@/components/personas/PersonaManager'
import { LANGUAGES } from '@/lib/languages'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'ai'

const STRICTNESS_OPTIONS = [
  { value: 'lenient',  label: 'Lenient',  desc: 'Partial credit for vague answers. Good for beginners.' },
  { value: 'standard', label: 'Standard', desc: 'Balanced scoring that rewards good technique.' },
  { value: 'strict',   label: 'Strict',   desc: 'Demands precise language and clear evidence. Expert level.' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  // Profile state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // AI prefs state (localStorage)
  const [defaultVoice, setDefaultVoice] = useState('nova')
  const [strictness, setStrictness] = useState('standard')
  const [defaultLanguage, setDefaultLanguage] = useState('en-US')
  const [savedPrefs, setSavedPrefs] = useState(false)

  // Load profile
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setName(d.user.name || '')
          setEmail(d.user.email || '')
        }
      })
  }, [])

  // Load AI prefs from localStorage
  useEffect(() => {
    setDefaultVoice(localStorage.getItem('pref_voice') || 'nova')
    setStrictness(localStorage.getItem('pref_strictness') || 'standard')
    setDefaultLanguage(localStorage.getItem('pref_language') || 'en-US')
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()

    if (data.error) {
      setProfileMsg({ type: 'error', text: data.error })
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
    }
    setSavingProfile(false)
  }

  function saveAIPrefs() {
    localStorage.setItem('pref_voice', defaultVoice)
    localStorage.setItem('pref_strictness', strictness)
    localStorage.setItem('pref_language', defaultLanguage)
    setSavedPrefs(true)
    setTimeout(() => setSavedPrefs(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and AI preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/[0.03] border border-white/8 rounded-xl p-1 w-fit">
        {([
          { id: 'profile', label: '◉  Profile' },
          { id: 'ai',      label: '◈  AI Preferences' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'text-sm px-5 py-2 rounded-lg transition-all',
              tab === t.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed"
              />
              <p className="text-[10px] text-white/20 mt-1.5">Email changes require account verification — coming soon.</p>
            </div>
          </div>

          {profileMsg && (
            <div className={cn(
              'text-xs px-4 py-2.5 rounded-xl border',
              profileMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            )}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {/* ── AI Preferences tab ── */}
      {tab === 'ai' && (
        <div className="space-y-6">
          {/* Default voice */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">Default Persona Voice</h3>
            <p className="text-xs text-white/30 mb-4">Used when a persona has no voice assigned.</p>
            <div className="grid grid-cols-3 gap-2">
              {VOICE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setDefaultVoice(v.value)}
                  className={cn(
                    'text-left px-3 py-2.5 rounded-xl border transition-all',
                    defaultVoice === v.value
                      ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  )}
                >
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Default language */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">Default Call Language</h3>
            <p className="text-xs text-white/30 mb-4">Pre-selected when starting a new roleplay call.</p>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setDefaultLanguage(lang.code)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all',
                    defaultLanguage === lang.code
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/[0.03] border-white/8 text-white/50 hover:border-white/20'
                  )}
                >
                  <span>{lang.flag}</span>
                  <span className="text-xs">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scoring strictness */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">Scoring Strictness</h3>
            <p className="text-xs text-white/30 mb-4">Controls how the AI coach evaluates your responses.</p>
            <div className="space-y-2">
              {STRICTNESS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStrictness(opt.value)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all',
                    strictness === opt.value
                      ? 'bg-indigo-600/20 border-indigo-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all',
                    strictness === opt.value ? 'border-indigo-400 bg-indigo-400' : 'border-white/20'
                  )} />
                  <div>
                    <div className={cn('text-sm font-medium', strictness === opt.value ? 'text-indigo-300' : 'text-white/70')}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveAIPrefs}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {savedPrefs ? '✓ Saved' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  )
}
