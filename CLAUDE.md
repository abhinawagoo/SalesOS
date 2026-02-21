# SalesOS — Claude Context

## What This Is
AI Operating System for sales teams. Simulates real enterprise buyers, scores conversations with structured AI intelligence, tracks skill progression across individuals and teams.

**Three pillars: Simulation → Structured Feedback → Skill Analytics**

## Live URLs
- Production: https://sales-os-alpha.vercel.app
- GitHub: https://github.com/abhinawagoo/SalesOS
- Supabase project: https://hdalzxjzjiplydzzdgkm.supabase.co

## Tech Stack
- **Frontend**: Next.js 16.1.6 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **AI**: Anthropic Claude claude-sonnet-4-6 — roleplay engine + scoring engine
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (email/password)
- **Charts**: Recharts (RadarChart)
- **Validation**: Zod (scoring JSON schema enforcement)
- **Hosting**: Vercel + Supabase

## Key Architecture Decisions

### Auth Flow
- Signup → `supabase.auth.signUp()` with metadata `{ name, role, org_name }`
- DB trigger (`supabase/trigger.sql`) auto-creates org + user profile on insert into `auth.users`
- Email confirmation link redirects to `/auth/callback` which exchanges code for session
- Login uses `window.location.href` (not `router.push + router.refresh`) to avoid double requests

### AI Engines
- **Roleplay** (`/api/chat`): Claude acts as buyer persona. System prompt enforces character, objection style, difficulty. 300 token limit per response.
- **Scoring** (`/api/score`): Separate Claude call analyzes full transcript. Returns strict JSON validated by Zod. 5 dimensions: discovery, objection_handling, value_articulation, clarity, closing (0–10).

### Multi-tenancy
- Row Level Security (RLS) on all tables
- Reps see only their own sessions
- Managers see all sessions within their organization
- Personas: global (org_id = null) or org-specific

## Directory Structure
```
src/
  app/
    page.tsx                        Landing page
    layout.tsx                      Root layout (dark theme)
    globals.css                     Dark theme (#0a0a0f bg)
    auth/
      login/page.tsx                Email + password login
      signup/page.tsx               Signup (calls DB trigger via signUp metadata)
      callback/route.ts             Exchanges email confirmation code for session
    api/
      auth/setup/route.ts           Legacy — kept but no longer called by signup
      chat/route.ts                 POST: Claude roleplay chat
      score/route.ts                POST: Score transcript, validate JSON, save
      sessions/route.ts             POST: Create new session
      personas/route.ts             POST: Create persona (manager only)
    dashboard/
      layout.tsx                    Auth guard + Sidebar (shows ProfileSetupError if no profile)
      rep/page.tsx                  Rep dashboard: radar chart, session history, stats
      manager/page.tsx              Manager dashboard: team table, underperformer alerts
    simulate/
      layout.tsx                    Auth guard + Sidebar
      page.tsx                      Loads personas, renders SimulateClient
    personas/
      layout.tsx                    Manager-only guard + Sidebar
      page.tsx                      Loads personas, renders PersonaManager
    architecture/page.tsx           Investor-facing system architecture page
  components/
    layout/
      Sidebar.tsx                   Left nav, role-aware links, sign out
      ProfileSetupError.tsx         Shown when user is authed but has no DB profile
    chat/
      SimulateClient.tsx            Full simulation UI: setup → chat → scored phases
      ScoreCard.tsx                 Post-session score display with radar + coaching
    dashboard/
      RepRadarChart.tsx             Recharts RadarChart for 5 skill dimensions
    personas/
      PersonaManager.tsx            Create + list buyer personas (manager only)
  lib/
    types.ts                        All TypeScript types (UserProfile, Session, etc.)
    utils.ts                        cn(), getOverallScore(), scoreColor(), scoreBg()
    supabase/
      client.ts                     Browser Supabase client
      server.ts                     Server Supabase client (async cookies)
      middleware.ts                 updateSession() used by proxy.ts
  proxy.ts                          Next.js 16 auth middleware (renamed from middleware.ts)
supabase/
  schema.sql                        All tables + RLS policies + seeded personas
  trigger.sql                       DB trigger: auto-create org+profile on auth.users insert
```

## Database Schema
```
organizations   id, name, created_at
users           id (→ auth.users), name, email, role, organization_id, created_at
personas        id, title, industry, buyer_role, difficulty, personality_traits[], objection_style, organization_id
sessions        id, user_id, persona_id, transcript (JSONB), scores (JSONB), created_at
```

### sessions.scores JSON shape
```json
{
  "scores": { "discovery": 0-10, "objection_handling": 0-10, "value_articulation": 0-10, "clarity": 0-10, "closing": 0-10 },
  "summary": "...",
  "strengths": [],
  "weaknesses": [],
  "coaching_suggestions": []
}
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Only used by /api/auth/setup (legacy)
ANTHROPIC_API_KEY=                # Required for /api/chat and /api/score
```
All four must be set in Vercel → Project Settings → Environment Variables.

## Roles
- `rep`: simulate, view own dashboard
- `manager`: simulate, view team dashboard, create/manage personas

## Default Personas (seeded in schema.sql)
1. Skeptical CFO — Enterprise SaaS — hard
2. Busy VP of Sales — Technology — medium
3. Technical Evaluator — Software — medium
4. Status Quo Defender — Financial Services — easy

## Known Issues & Decisions
- `proxy.ts` exports `proxy` function (Next.js 16 renamed `middleware` → `proxy`)
- Supabase clients are lazy-initialized inside handlers (not module level) to avoid build-time errors
- `ProfileSetupError` component breaks the redirect loop that occurs when auth user exists but no DB profile
- `window.location.href` used for post-auth redirect (not `router.push`) to avoid double server requests
- The `users_read_org` RLS policy is recursive but PostgreSQL handles this safely

## Supabase Setup Checklist
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Run `supabase/trigger.sql` in SQL Editor
- [ ] Set Site URL: `https://sales-os-alpha.vercel.app`
- [ ] Add Redirect URL: `https://sales-os-alpha.vercel.app/auth/callback`
- [ ] Add all 4 env vars in Vercel dashboard
