-- Run this in Supabase SQL Editor to enable demo mode
-- Creates the hardcoded demo user + org that the app uses when auth is bypassed

INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000002', 'SalesOS Demo Org')
ON CONFLICT (id) DO NOTHING;

-- Insert into auth.users first (required for FK constraint)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@salesos.ai',
  '',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User","role":"manager"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Now insert the user profile
INSERT INTO users (id, name, email, role, organization_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo User',
  'demo@salesos.ai',
  'manager',
  '00000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO NOTHING;
