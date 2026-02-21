'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileSetupErrorProps {
  userId: string
  email: string
}

export default function ProfileSetupError({ userId, email }: ProfileSetupErrorProps) {
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/signup'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400 text-xl">
          ⚠
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">Account setup incomplete</h1>
        <p className="text-sm text-white/40 mb-2">
          Your auth account exists (<span className="text-white/60">{email}</span>) but your profile
          wasn&apos;t created in the database.
        </p>
        <p className="text-xs text-white/30 mb-6">
          This usually means the Supabase schema hasn&apos;t been applied yet, or the setup API call failed.
          Sign out and create a new account once the database is ready.
        </p>
        <div className="space-y-2">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Signing out...' : 'Sign out & try again'}
          </button>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-white/10 hover:border-white/20 text-white/40 hover:text-white/70 py-2.5 rounded-xl text-sm transition-all"
          >
            Open Supabase dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
