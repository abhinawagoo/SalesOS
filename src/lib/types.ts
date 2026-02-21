export type UserRole = 'rep' | 'manager'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  organization_id: string
  created_at: string
  organizations?: Organization
}

export interface Persona {
  id: string
  title: string
  industry: string
  buyer_role: string
  difficulty: 'easy' | 'medium' | 'hard'
  personality_traits: string[]
  objection_style: string
  organization_id: string | null
  created_at: string
}

export interface Message {
  role: 'system' | 'assistant' | 'user'
  content: string
}

export interface ScoreBreakdown {
  discovery: number
  objection_handling: number
  value_articulation: number
  clarity: number
  closing: number
}

export interface SessionScore {
  scores: ScoreBreakdown
  summary: string
  strengths: string[]
  weaknesses: string[]
  coaching_suggestions: string[]
}

export interface Session {
  id: string
  user_id: string
  persona_id: string
  transcript: Message[]
  scores: SessionScore | null
  created_at: string
  personas?: Persona
  users?: UserProfile
}

export interface TeamStats {
  user_id: string
  name: string
  email: string
  total_sessions: number
  avg_score: number
  weakest_skill: string
}
