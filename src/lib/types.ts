export type UserRole = 'rep' | 'manager'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ScenarioType = 'cold_outbound' | 'discovery' | 'objection_handling' | 'closing'
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed'

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  cold_outbound: 'Cold Outbound',
  discovery: 'Discovery Call',
  objection_handling: 'Objection Handling',
  closing: 'Closing Conversation',
}

export const SCENARIO_DESCRIPTIONS: Record<ScenarioType, string> = {
  cold_outbound: 'Open cold, earn interest, book a meeting',
  discovery: 'Uncover pain, quantify impact, map stakeholders',
  objection_handling: 'Handle budget, timing, and competitor pushback',
  closing: 'Align on next steps and secure commitment',
}

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
  difficulty: Difficulty
  personality_traits: string[]
  objection_style: string
  organization_id: string | null
  voice?: string        // OpenAI TTS voice (alloy|echo|fable|onyx|nova|shimmer)
  created_at: string
}

export interface Message {
  role: 'system' | 'assistant' | 'user'
  content: string
}

// ─── Scoring Framework (SalesOS IP) ────────────────────────────────────────

export interface SubSkillScore {
  score: number         // 1–10
  explanation: string   // 1-2 sentence analysis
  evidence: string      // direct transcript quote
}

export interface CategoryScore {
  score: number         // average of sub-skills
  sub_skills: Record<string, SubSkillScore>
}

export interface CoachingItem {
  behavior: string
  evidence: string      // transcript quote
}

export interface TopPerformerRewrite {
  original: string      // what rep actually said
  improved: string      // what top performer would say
  context: string       // situation context
}

export interface SessionCoaching {
  strengths: CoachingItem[]
  weaknesses: CoachingItem[]
  top_performer_rewrites: TopPerformerRewrite[]
  focus_recommendation: string
}

export interface SessionScore {
  overall_score: number
  categories: {
    discovery: CategoryScore & {
      sub_skills: {
        problem_depth: SubSkillScore
        quantification: SubSkillScore
        stakeholder_identification: SubSkillScore
      }
    }
    objection_handling: CategoryScore & {
      sub_skills: {
        acknowledgement: SubSkillScore
        reframing: SubSkillScore
        confidence_control: SubSkillScore
      }
    }
    value_articulation: CategoryScore & {
      sub_skills: {
        roi_clarity: SubSkillScore
        differentiation: SubSkillScore
        use_case_relevance: SubSkillScore
      }
    }
    closing: CategoryScore & {
      sub_skills: {
        clear_next_step: SubSkillScore
        timeline_alignment: SubSkillScore
        commitment_securing: SubSkillScore
      }
    }
  }
  coaching: SessionCoaching
}

// ─── Session ────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  user_id: string
  persona_id: string
  scenario_type: ScenarioType
  transcript: Message[]
  scores: SessionScore | null
  // future-ready fields (populated by call ingestion pipeline)
  call_recording_url?: string
  call_duration_seconds?: number
  objection_flags?: string[]
  question_count?: number
  sentiment_score?: number
  industry_tag?: string
  created_at: string
  personas?: Persona
  users?: UserProfile
}

// ─── Assignment ─────────────────────────────────────────────────────────────

export interface Assignment {
  id: string
  manager_id: string
  rep_id: string
  persona_id: string
  scenario_type: ScenarioType
  due_date: string | null
  status: AssignmentStatus
  manager_comment: string | null
  session_id: string | null
  created_at: string
  personas?: Persona
  rep?: UserProfile
  manager?: UserProfile
  sessions?: Session
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export interface KnowledgeItem {
  id: string
  organization_id: string
  title: string
  content: string
  item_type: string
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Company Config / Playbook ───────────────────────────────────────────────

export interface CompanyConfig {
  id: string
  organization_id: string
  icp_description: string
  must_ask_questions: string[]
  key_differentiators: string[]
  forbidden_phrases: string[]
  scoring_focus: string[]
  competitor_names: string[]
  updated_at: string
}

// ─── Hiring / Candidates ────────────────────────────────────────────────────

export type CandidateStatus = 'invited' | 'in_progress' | 'completed' | 'hired' | 'rejected'

export interface Candidate {
  id: string
  organization_id: string
  invited_by: string
  name: string
  email: string
  role_applied: string
  status: CandidateStatus
  assessment_token: string
  token_expires_at: string
  overall_score: number | null
  notes: string
  created_at: string
}

export interface CandidateSession {
  id: string
  candidate_id: string
  persona_id: string
  scenario_type: string
  transcript: Message[]
  scores: SessionScore | null
  created_at: string
}

// ─── Dashboard helpers ───────────────────────────────────────────────────────

export interface RepStats {
  user_id: string
  name: string
  email: string
  total_sessions: number
  avg_overall: number | null
  avg_discovery: number | null
  avg_objection: number | null
  avg_value: number | null
  avg_closing: number | null
}
