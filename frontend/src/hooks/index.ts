/**
 * Custom Hooks
 * 自定义React Hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { authApi, emotionApi, diaryApi, dashboardApi, crisisApi } from '../services/api'

// 认证相关Hook
export function useAuth() {
  const { token, user, isAuthenticated, setAuth, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (anonymousId: string, password: string) => {
    setLoading(true)
    try {
      const response = await authApi.login({ anonymous_id: anonymousId, password })
      const { access_token, user } = response.data
      setAuth(access_token, user)
      message.success('登录成功')
      return true
    } catch (error: any) {
      message.error(error.response?.data?.detail || '登录失败')
      return false
    } finally {
      setLoading(false)
    }
  }, [setAuth])

  const register = useCallback(async (data: {
    anonymous_id: string
    password: string
    consent_given: boolean
    disclaimer_accepted: boolean
  }) => {
    setLoading(true)
    try {
      await authApi.register(data)
      message.success('注册成功')
      return true
    } catch (error: any) {
      message.error(error.response?.data?.detail || '注册失败')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    token,
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  }
}

// 情绪数据Hook
export function useEmotion() {
  const [records, setRecords] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchRecords = useCallback(async (days = 7) => {
    setLoading(true)
    try {
      const response = await emotionApi.getRecords({ days })
      setRecords(response.data || [])
    } catch (error) {
      console.error('获取情绪记录失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async (days = 7) => {
    try {
      const response = await emotionApi.getStats({ days })
      setStats(response.data)
    } catch (error) {
      console.error('获取情绪统计失败', error)
    }
  }, [])

  const createRecord = useCallback(async (data: {
    primary_emotion: string
    intensity: number
    source_type?: string
    context_tags?: string[]
  }) => {
    try {
      await emotionApi.createRecord(data)
      message.success('情绪记录成功')
      fetchRecords()
    } catch (error) {
      message.error('记录失败')
    }
  }, [fetchRecords])

  useEffect(() => {
    fetchRecords()
    fetchStats()
  }, [fetchRecords, fetchStats])

  return {
    records,
    stats,
    loading,
    fetchRecords,
    fetchStats,
    createRecord
  }
}

// 日记Hook
export function useDiary() {
  const [diaries, setDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDiaries = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true)
    try {
      const response = await diaryApi.list({ limit, offset })
      setDiaries(response.data || [])
    } catch (error) {
      console.error('获取日记失败', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const createDiary = useCallback(async (data: {
    content: string
    mood?: string
    tags?: string[]
  }) => {
    try {
      await diaryApi.create(data)
      message.success('日记创建成功')
      fetchDiaries()
      return true
    } catch (error) {
      message.error('创建失败')
      return false
    }
  }, [fetchDiaries])

  const deleteDiary = useCallback(async (id: string) => {
    try {
      await diaryApi.delete(id)
      message.success('删除成功')
      fetchDiaries()
    } catch (error) {
      message.error('删除失败')
    }
  }, [fetchDiaries])

  useEffect(() => {
    fetchDiaries()
  }, [fetchDiaries])

  return {
    diaries,
    loading,
    fetchDiaries,
    createDiary,
    deleteDiary
  }
}

// 看板数据Hook
export function useDashboard(days = 30) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardApi.getDashboard({ days })
        setData(response.data)
      } catch (error) {
        console.error('获取看板数据失败', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [days])

  return { data, loading, refetch: () => setLoading(true) }
}

// 危机资源Hook
export function useCrisisResources() {
  const [resources, setResources] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, exercisesRes] = await Promise.all([
          crisisApi.getResources(),
          crisisApi.getGroundingExercises()
        ])
        setResources(resourcesRes.data || [])
        setExercises(exercisesRes.data?.exercises || [])
      } catch (error) {
        console.error('获取危机资源失败', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { resources, exercises, loading }
}