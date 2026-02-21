-- SalesOS Database Schema
-- Run this in your Supabase SQL editor

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rep' CHECK (role IN ('rep', 'manager')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personas
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  industry TEXT NOT NULL,
  buyer_role TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  personality_traits TEXT[] DEFAULT '{}',
  objection_style TEXT NOT NULL DEFAULT 'moderate',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  transcript JSONB NOT NULL DEFAULT '[]',
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own" ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can read org members (for manager dashboard)
CREATE POLICY "users_read_org" ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Organizations readable by members
CREATE POLICY "orgs_read_members" ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Personas: global (no org) + org-specific
CREATE POLICY "personas_read" ON personas FOR SELECT
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "personas_insert_manager" ON personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "personas_update_manager" ON personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "personas_delete_manager" ON personas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Sessions: reps see own, managers see org
CREATE POLICY "sessions_read_own" ON sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sessions_read_manager" ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.organization_id = u2.organization_id
      WHERE u1.id = auth.uid()
        AND u1.role = 'manager'
        AND u2.id = sessions.user_id
    )
  );

CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_own" ON sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Seed: Default personas
INSERT INTO personas (title, industry, buyer_role, difficulty, personality_traits, objection_style)
VALUES
  ('Skeptical CFO', 'Enterprise SaaS', 'Chief Financial Officer', 'hard',
   ARRAY['analytical', 'cost-focused', 'risk-averse', 'time-pressed'],
   'Challenges ROI immediately, demands hard numbers, brings up budget constraints'),
  ('Busy VP of Sales', 'Technology', 'VP of Sales', 'medium',
   ARRAY['impatient', 'results-oriented', 'competitive', 'skeptical'],
   'Dismisses features quickly, wants proof of revenue impact, mentions 3 competing solutions'),
  ('Technical Evaluator', 'Software', 'Senior Engineer', 'medium',
   ARRAY['detail-oriented', 'security-conscious', 'integration-focused', 'deliberate'],
   'Deep-dives on technical specs, raises integration complexity, questions scalability'),
  ('Status Quo Defender', 'Financial Services', 'Operations Manager', 'easy',
   ARRAY['change-resistant', 'process-oriented', 'team-focused', 'cautious'],
   'Claims current solution works fine, worried about team disruption and learning curve')
ON CONFLICT DO NOTHING;
