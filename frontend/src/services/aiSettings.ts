import axios from 'axios'
import { useAISettingsStore } from '../stores/aiSettingsStore'

const API_BASE = '/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('heartmirror-auth')
    if (token) {
      const authData = JSON.parse(token)
      if (authData?.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export interface AISettingsResponse {
  id: number
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TestConnectionResponse {
  connected: boolean
  model: string
  error?: string
  responseTime?: number
  response?: string
}

/**
 * AI设置服务
 */
export const aiSettingsApi = {
  /**
   * 获取AI设置
   */
  getSettings: async (): Promise<{ data: AISettingsResponse }> => {
    const response = await api.get('/settings/ai')
    return response
  },

  /**
   * 更新AI设置
   */
  updateSettings: async (settings: {
    apiKey?: string
    baseUrl?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }): Promise<{ data: AISettingsResponse }> => {
    const response = await api.post('/settings/ai', settings)
    return response
  },

  /**
   * 测试AI连接
   */
  testConnection: async (settings: {
    apiKey: string
    baseUrl: string
    model: string
  }): Promise<{ data: TestConnectionResponse }> => {
    const response = await api.post('/settings/ai/test', settings)
    return response
  },

  /**
   * 删除AI设置
   */
  deleteSettings: async (): Promise<void> => {
    await api.delete('/settings/ai')
  },
}