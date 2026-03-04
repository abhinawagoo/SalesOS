'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState<'rep' | 'manager'>('rep')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, org_name: orgName || `${name}'s Workspace` },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Always call setup as a fallback in case the DB trigger isn't installed.
    // The setup route is idempotent — it's a no-op if the profile already exists.
    if (data.user) {
      await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          name,
          email,
          role,
          orgName: orgName || `${name}'s Workspace`,
        }),
      }).catch(() => {/* non-fatal */})
    }

    if (data.session) {
      // Email confirmation OFF — redirect immediately
      window.location.href = role === 'manager' ? '/dashboard/manager' : '/dashboard/rep'
    } else {
      // Email confirmation ON — show inbox prompt
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✉
          </div>
          <h1 className="text-lg font-semibold text-white mb-2">Check your email</h1>
          <p className="text-sm text-white/40 mb-6">
            We sent a confirmation link to <span className="text-white/70">{email}</span>.
            Click it to activate your account and get started.
          </p>
          <Link href="/auth/login" className="text-indigo-400 text-sm hover:text-indigo-300">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-semibold text-white tracking-tight">SalesOS</span>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Create account</h1>
          <p className="text-sm text-white/40 mb-6">Start your sales intelligence journey</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                placeholder="Alex Johnson"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Organization name <span className="text-white/25">(optional)</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                placeholder="Acme Corp (or leave blank)"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'rep' | 'manager')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              >
                <option value="rep" className="bg-[#1a1a2e]">Sales Rep</option>
                <option value="manager" className="bg-[#1a1a2e]">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/30 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
