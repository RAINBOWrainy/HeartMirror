/**
 * Settings Page Tests
 * AI设置页面测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Settings from './Settings'

// Mock dependencies
vi.mock('@/stores/aiSettingsStore', () => ({
  useAISettingsStore: () => ({
    settings: {},
    setSettings: vi.fn()
  })
}))

const mockGetSettings = vi.fn().mockResolvedValue({
  data: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true
  }
})
const mockUpdateSettings = vi.fn().mockResolvedValue({ success: true })
const mockTestConnection = vi.fn().mockResolvedValue({
  data: {
    connected: true,
    model: 'gpt-4o',
    responseTime: 0.5,
    response: 'OK'
  }
})

vi.mock('@/services/aiSettings', () => ({
  aiSettingsApi: {
    getSettings: () => mockGetSettings(),
    updateSettings: (data: any) => mockUpdateSettings(data),
    testConnection: (data: any) => mockTestConnection(data)
  },
  TestConnectionResponse: vi.fn()
}))

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  )
}

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render page title and description', () => {
    renderWithRouter()
    expect(screen.getByText('AI 设置')).toBeInTheDocument()
    expect(screen.getByText(/配置您的AI API以启用对话功能/)).toBeInTheDocument()
  })

  it('should render all provider groups', () => {
    renderWithRouter()
    expect(screen.getByText('国际服务')).toBeInTheDocument()
    expect(screen.getByText('国内服务')).toBeInTheDocument()
    expect(screen.getByText('本地部署')).toBeInTheDocument()
  })

  it('should populate form with default values', async () => {
    renderWithRouter()
    await waitFor(() => {
      const baseUrlInput = screen.getByLabelText(/API Base URL/)
      expect(baseUrlInput).toHaveValue('https://api.openai.com/v1')
    })
  })

  it('should update base URL when provider clicked', () => {
    renderWithRouter()
    const anthropicButton = screen.getByText('Anthropic')
    fireEvent.click(anthropicButton)

    const baseUrlInput = screen.getByLabelText(/API Base URL/)
    expect(baseUrlInput).toHaveValue('https://api.anthropic.com/v1')
  })

  it('should allow input changes for all fields', async () => {
    renderWithRouter()
    await waitFor(() => {
      const apiKeyInput = screen.getByLabelText(/API Key/)
      fireEvent.change(apiKeyInput, { target: { value: 'sk-test-123' } })
      expect(apiKeyInput).toHaveValue('sk-test-123')

      const baseUrlInput = screen.getByLabelText(/API Base URL/)
      fireEvent.change(baseUrlInput, { target: { value: 'https://custom.api/v1' } })
      expect(baseUrlInput).toHaveValue('https://custom.api/v1')

      const temperatureInput = screen.getByLabelText(/Temperature/)
      fireEvent.change(temperatureInput, { target: { value: '1.0' } })
      expect(temperatureInput).toHaveValue(1)

      const maxTokensInput = screen.getByLabelText(/Max Tokens/)
      fireEvent.change(maxTokensInput, { target: { value: '4000' } })
      expect(maxTokensInput).toHaveValue(4000)
    })
  })

  it('should show alert when testing with incomplete configuration', () => {
    // Mock global.alert for this test
    const originalAlert = window.alert
    window.alert = vi.fn()

    renderWithRouter()
    const testButton = screen.getByText('测试连接')
    fireEvent.click(testButton)

    expect(window.alert).toHaveBeenCalledWith('请填写完整的API配置后再测试')
    window.alert = originalAlert
  })

  it('should render local deployment guide', () => {
    renderWithRouter()
    expect(screen.getByText('本地部署指南')).toBeInTheDocument()
    expect(screen.getByText('Ollama 本地部署')).toBeInTheDocument()
    expect(screen.getByText('LM Studio 本地部署')).toBeInTheDocument()
  })

  it('should render security notice', () => {
    renderWithRouter()
    expect(screen.getByText(/您的API密钥将被加密存储在本地/)).toBeInTheDocument()
  })

  it('should show all popular models in select dropdown', async () => {
    renderWithRouter()
    await waitFor(() => {
      const modelSelect = screen.getByLabelText(/模型/)
      fireEvent.click(modelSelect)

      // Check that some common models are present
      expect(screen.getByText('GPT-4o')).toBeInTheDocument()
      expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument()
      expect(screen.getByText('GLM-4')).toBeInTheDocument()
    })
  })
})
