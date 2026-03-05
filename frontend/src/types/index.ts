/**
 * HeartMirror TypeScript Types
 * 类型定义
 */

// 用户相关类型
export interface User {
  id: string
  anonymous_id: string
  risk_level: 'green' | 'yellow' | 'orange' | 'red'
  created_at: string
  last_active_at?: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}

// 情绪相关类型
export interface EmotionRecord {
  id: string
  primary_emotion: string
  intensity: number
  confidence: number
  source_type: string
  context_tags?: string[]
  recorded_at: string
}

export interface EmotionStats {
  total_records: number
  dominant_emotion?: string
  average_intensity: number
  emotion_distribution: Record<string, number>
  trend?: EmotionTrendPoint[]
}

export interface EmotionTrendPoint {
  date: string
  average_intensity: number
  dominant_emotion: string
}

// 对话相关类型
export interface ChatSession {
  id: string
  title?: string
  status: 'active' | 'archived' | 'deleted'
  currentStage: string
  messageCount: number
  startedAt: Date
  lastMessageAt?: Date
  messages: ChatMessage[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  emotionIntensity?: number
  timestamp: Date
}

// 前端使用的消息类型（与 ChatMessage 兼容）
export type Message = ChatMessage

// 前端使用的会话类型
export interface ChatSessionState {
  id: string
  title?: string
  messages: Message[]
  currentStage: string
  createdAt: Date
  lastMessageAt?: Date
}

// 日记相关类型
export interface Diary {
  id: string
  mood?: string
  tags?: string[]
  emotion?: string
  emotion_intensity?: number
  created_at: string
  content?: string
}

// 干预相关类型
export interface InterventionPlan {
  id: string
  name: string
  intervention_type: string
  content: Record<string, unknown>
  difficulty_level: number
  estimated_duration: number
  is_active: boolean
}

export interface InterventionSession {
  id: string
  plan_id: string
  is_completed: boolean
  actual_duration?: number
  user_rating?: number
  intensity_before?: number
  intensity_after?: number
}

// 看板相关类型
export interface DashboardOverview {
  total_sessions: number
  total_diaries: number
  total_interventions: number
  current_streak: number
  risk_level: string
}

export interface InterventionStats {
  total: number
  completed: number
  completion_rate: number
  by_type: Record<string, number>
}

export interface DashboardData {
  overview: DashboardOverview
  emotion_trend: EmotionTrendPoint[]
  emotion_distribution: Record<string, number>
  intervention_stats: InterventionStats
  recent_activities: Activity[]
}

export interface Activity {
  type: string
  title: string
  timestamp: string
}

// 危机支持相关类型
export interface CrisisResource {
  name: string
  phone: string
  description: string
  available_hours: string
  region: string
}

export interface GroundingExercise {
  name: string
  description: string
  steps: string[]
  duration: string
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}