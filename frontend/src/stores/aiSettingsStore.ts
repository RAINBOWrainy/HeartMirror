import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * AI设置接口
 * 用户可以配置自己的AI API Key、Base URL和模型
 */
export interface AISettings {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  isActive: boolean
}

interface AISettingsState {
  settings: AISettings
  setSettings: (settings: Partial<AISettings>) => void
  resetSettings: () => void
}

const defaultSettings: AISettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  isActive: false,
}

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'heartmirror-ai-settings',
    }
  )
)