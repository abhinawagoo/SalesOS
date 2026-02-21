-- SalesOS v2 Migration
-- Run in Supabase SQL Editor after schema.sql

-- Add scenario_type to sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS scenario_type TEXT NOT NULL DEFAULT 'discovery'
    CHECK (scenario_type IN ('cold_outbound','discovery','objection_handling','closing'));

-- Future-ready fields for real call ingestion (store now, use later)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS objection_flags TEXT[],
  ADD COLUMN IF NOT EXISTS question_count INTEGER,
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS industry_tag TEXT;

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('cold_outbound','discovery','objection_handling','closing')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  manager_comment TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Managers can CRUD their own assignments
CREATE POLICY "assignments_manager_all" ON assignments
  FOR ALL USING (manager_id = auth.uid());

-- Reps can read their assigned work
CREATE POLICY "assignments_rep_read" ON assignments
  FOR SELECT USING (rep_id = auth.uid());

-- Reps can update status on their assignments
CREATE POLICY "assignments_rep_update" ON assignments
  FOR UPDATE USING (rep_id = auth.uid());

-- Update demo seed org + user to survive demo-seed.sql
-- (No changes needed — assignments don't require new demo data)
