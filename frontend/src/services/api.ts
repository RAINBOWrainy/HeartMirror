import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除当前状态，刷新页面触发自动重新登录
      useAuthStore.getState().logout()
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default api

// 认证相关 API
export const authApi = {
  register: (data: { anonymous_id: string; password: string; consent_given: boolean; disclaimer_accepted: boolean }) =>
    api.post('/auth/register', data),
  login: (data: { anonymous_id: string; password: string }) =>
    api.post('/auth/login', data),
  guestLogin: () =>
    api.post('/auth/guest'),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// 聊天相关 API
export const chatApi = {
  createSession: (data?: { title?: string }) =>
    api.post('/chat/sessions', data || {}),
  getSessions: (params?: { limit?: number; offset?: number }) =>
    api.get('/chat/sessions', { params }),
  getSession: (sessionId: string) =>
    api.get(`/chat/sessions/${sessionId}`),
  sendMessage: (data: { session_id?: string; message: string }) =>
    api.post('/chat/send', data),
  deleteSession: (sessionId: string) =>
    api.delete(`/chat/sessions/${sessionId}`),
}

// 情绪相关 API
export const emotionApi = {
  createRecord: (data: { primary_emotion: string; intensity: number; source_type?: string; context_tags?: string[] }) =>
    api.post('/emotion/record', data),
  getRecords: (params?: { days?: number; limit?: number }) =>
    api.get('/emotion/records', { params }),
  getStats: (params?: { days?: number }) =>
    api.get('/emotion/stats', { params }),
  analyzeText: (text: string) =>
    api.get('/emotion/analyze', { params: { text } }),
}

// 日记相关 API
export const diaryApi = {
  create: (data: { content: string; mood?: string; tags?: string[] }) =>
    api.post('/diary', data),
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/diary', { params }),
  get: (diaryId: string) =>
    api.get(`/diary/${diaryId}`),
  update: (diaryId: string, data: { content?: string; mood?: string; tags?: string[] }) =>
    api.put(`/diary/${diaryId}`, data),
  delete: (diaryId: string) =>
    api.delete(`/diary/${diaryId}`),
}

// 看板相关 API
export const dashboardApi = {
  getDashboard: (params?: { days?: number }) =>
    api.get('/dashboard', { params }),
}

// 危机支持相关 API
export const crisisApi = {
  getResources: () => api.get('/crisis/resources'),
  getHotline: () => api.get('/crisis/hotline'),
  getSafetyPlan: () => api.get('/crisis/safety-plan'),
  getImmediateHelp: () => api.get('/crisis/immediate-help'),
  getGroundingExercises: () => api.get('/crisis/grounding-exercises'),
}