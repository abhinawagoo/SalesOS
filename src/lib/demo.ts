import { UserProfile } from './types'

// Fixed demo user — must exist in Supabase DB (run supabase/demo-seed.sql)
export const DEMO_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo User',
  email: 'demo@salesos.ai',
  role: 'manager',
  organization_id: '00000000-0000-0000-0000-000000000002',
  created_at: new Date().toISOString(),
}
