export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-semibold text-white text-sm tracking-tight">SalesOS</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">System Architecture</h1>
          <p className="text-white/40 text-base max-w-xl">
            SalesOS is built as multi-tenant AI infrastructure for sales skill intelligence —
            not a chat toy, but a structured feedback and measurement system.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">AI Orchestration Layer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Simulation Engine',
                desc: 'Claude claude-sonnet-4-6 acting as enterprise buyer personas. System prompts enforce role, difficulty, objection style. Context window maintains session memory.',
                tag: 'Claude API',
                color: 'border-indigo-500/20 bg-indigo-500/5',
              },
              {
                title: 'Scoring Engine',
                desc: 'Separate Claude instance analyzes rep transcript. Outputs structured JSON against 5 skill dimensions. Validated with Zod schema before storage.',
                tag: 'Structured Output',
                color: 'border-purple-500/20 bg-purple-500/5',
              },
              {
                title: 'Prompt Guardrails',
                desc: 'System prompts prevent buyer from being helpful, maintain character, enforce response length, simulate real objection patterns.',
                tag: 'Guardrails',
                color: 'border-violet-500/20 bg-violet-500/5',
              },
            ].map((item) => (
              <div key={item.title} className={`border rounded-xl p-5 ${item.color}`}>
                <div className="text-xs font-medium text-indigo-400 mb-2">{item.tag}</div>
                <div className="text-sm font-semibold text-white mb-2">{item.title}</div>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Layer */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">Data & Security Layer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Organization Isolation</h3>
              <p className="text-xs text-white/40 leading-relaxed mb-4">
                Row Level Security (RLS) enforced at the database layer via Supabase PostgreSQL policies.
                Each organization has hard data boundaries — reps can only see their own sessions,
                managers can only see their org&apos;s team data.
              </p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-white/50">
                <div className="text-indigo-400">-- Session isolation policy</div>
                <div>SELECT * FROM sessions</div>
                <div>WHERE user_id = auth.uid()</div>
                <div className="text-white/30">-- or manager org check</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Structured Output Enforcement</h3>
              <p className="text-xs text-white/40 leading-relaxed mb-4">
                Scoring responses are validated against a strict Zod schema before being accepted.
                Malformed or incomplete JSON is rejected — ensuring data integrity across all skill dimensions.
              </p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-white/50">
                <div className="text-purple-400">// Score validation</div>
                <div>ScoreSchema.parse(response)</div>
                <div>→ discovery: 0-10</div>
                <div>→ objection_handling: 0-10</div>
                <div>→ ... 5 dimensions total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schema */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">Database Schema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { table: 'organizations', fields: ['id', 'name', 'created_at'] },
              { table: 'users', fields: ['id', 'name', 'email', 'role', 'organization_id'] },
              { table: 'personas', fields: ['id', 'title', 'industry', 'buyer_role', 'difficulty', 'personality_traits', 'objection_style'] },
              { table: 'sessions', fields: ['id', 'user_id', 'persona_id', 'transcript (JSON)', 'scores (JSON)'] },
            ].map((t) => (
              <div key={t.table} className="bg-white/[0.03] rounded-xl p-4">
                <div className="text-xs font-semibold text-indigo-400 mb-2 font-mono">{t.table}</div>
                <div className="space-y-1">
                  {t.fields.map((f) => (
                    <div key={f} className="text-[11px] text-white/30 font-mono">{f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Layer */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8 mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">API Layer</h2>
          <div className="space-y-3">
            {[
              { method: 'POST', path: '/api/auth/setup', desc: 'Creates organization + user profile on signup (service role)' },
              { method: 'POST', path: '/api/sessions', desc: 'Creates new simulation session, returns session ID' },
              { method: 'POST', path: '/api/chat', desc: 'Sends message to Claude buyer, updates transcript in DB' },
              { method: 'POST', path: '/api/score', desc: 'Analyzes full transcript, validates JSON score, saves to DB' },
              { method: 'POST', path: '/api/personas', desc: 'Manager-only: creates custom buyer persona for org' },
            ].map((route) => (
              <div key={route.path} className="flex items-center gap-4 py-2.5 px-4 bg-black/20 rounded-lg">
                <span className="text-[11px] font-mono bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded w-12 text-center flex-shrink-0">{route.method}</span>
                <span className="text-xs font-mono text-white/60 w-44 flex-shrink-0">{route.path}</span>
                <span className="text-xs text-white/30">{route.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-8">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-6">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { layer: 'Frontend', tech: 'Next.js 14 (App Router), TypeScript, Tailwind CSS' },
              { layer: 'AI', tech: 'Anthropic Claude claude-sonnet-4-6 via official SDK' },
              { layer: 'Database', tech: 'PostgreSQL via Supabase with Row Level Security' },
              { layer: 'Auth', tech: 'Supabase Auth (email/password) with SSR session management' },
              { layer: 'Validation', tech: 'Zod schema validation on all AI structured outputs' },
              { layer: 'Charts', tech: 'Recharts (Radar, Bar) for skill analytics visualization' },
            ].map((item) => (
              <div key={item.layer} className="bg-white/[0.03] rounded-xl p-4">
                <div className="text-xs text-white/30 mb-1">{item.layer}</div>
                <div className="text-sm text-white/70">{item.tech}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
