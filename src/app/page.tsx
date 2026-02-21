import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-semibold text-white tracking-tight">SalesOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          AI-Powered Sales Intelligence
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
          Train your team against{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            real buyers
          </span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mb-10 leading-relaxed">
          SalesOS simulates enterprise buyers, scores every conversation with structured AI intelligence,
          and tracks skill progression across your entire team.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/signup"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-xl transition-colors glow-blue"
          >
            Start simulating free
          </Link>
          <Link
            href="/architecture"
            className="border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            View architecture
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-12 max-w-lg">
          {[
            { label: 'Skill Dimensions', value: '5' },
            { label: 'Buyer Personas', value: '4+' },
            { label: 'Structured Feedback', value: 'AI' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Feature pills */}
      <div className="border-t border-white/5 px-6 py-6 flex flex-wrap justify-center gap-4">
        {['AI Roleplay Simulation', 'Structured Scoring', 'Skill Analytics', 'Team Intelligence', 'Manager Dashboard'].map((f) => (
          <span key={f} className="text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full">{f}</span>
        ))}
      </div>
    </div>
  )
}
