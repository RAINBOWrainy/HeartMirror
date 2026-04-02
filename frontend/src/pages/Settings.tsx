/**
 * Settings Page
 * AI设置页面 - 使用 Tailwind + shadcn/ui
 */

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Key, CheckCircle, XCircle, Zap, Globe, Cloud, Laptop, ChevronDown } from 'lucide-react'
import { aiSettingsApi, TestConnectionResponse } from '@/services/aiSettings'
import { useAISettingsStore } from '@/stores/aiSettingsStore'
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Alert,
  Spinner
} from '@/components/ui'
import { cn } from '@/lib/utils'

// 常用模型列表
const popularModels = [
  { label: 'GPT-4o (推荐)', value: 'gpt-4o', group: 'OpenAI' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', group: 'OpenAI' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', group: 'OpenAI' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022', group: 'Anthropic' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229', group: 'Anthropic' },
  { label: 'GLM-4', value: 'glm-4', group: '智谱AI' },
  { label: 'GLM-4 Flash', value: 'glm-4-flash', group: '智谱AI' },
  { label: 'DeepSeek Chat', value: 'deepseek-chat', group: 'DeepSeek' },
  { label: 'DeepSeek Coder', value: 'deepseek-coder', group: 'DeepSeek' },
  { label: 'Qwen Turbo', value: 'qwen-turbo', group: '通义千问' },
  { label: 'Qwen Plus', value: 'qwen-plus', group: '通义千问' },
  { label: 'Qwen Max', value: 'qwen-max', group: '通义千问' },
  { label: 'Moonshot V1 8K', value: 'moonshot-v1-8k', group: 'Moonshot' },
  { label: 'Moonshot V1 32K', value: 'moonshot-v1-32k', group: 'Moonshot' },
  { label: 'Llama 3', value: 'llama3', group: '本地' },
  { label: 'Qwen2 7B', value: 'qwen2:7b', group: '本地' },
  { label: 'Mistral', value: 'mistral', group: '本地' },
]

// API 提供商分组
const apiProviderGroups = [
  {
    title: '国际服务',
    icon: Globe,
    providers: [
      { name: 'OpenAI', url: 'https://api.openai.com/v1' },
      { name: 'Azure OpenAI', url: 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments' },
      { name: 'Anthropic', url: 'https://api.anthropic.com/v1' },
      { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
      { name: 'Groq', url: 'https://api.groq.com/openai/v1' },
    ],
  },
  {
    title: '国内服务',
    icon: Cloud,
    providers: [
      { name: '智谱AI', url: 'https://open.bigmodel.cn/api/paas/v4' },
      { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
      { name: '通义千问', url: 'https://dashscope.aliyuncs.com/api/v1' },
      { name: '月之暗面', url: 'https://api.moonshot.cn/v1' },
    ],
  },
  {
    title: '本地部署',
    icon: Laptop,
    providers: [
      { name: 'Ollama', url: 'http://localhost:11434/v1' },
      { name: 'LM Studio', url: 'http://localhost:1234/v1' },
      { name: 'vLLM', url: 'http://localhost:8000/v1' },
    ],
  },
]

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null)
  const { settings, setSettings } = useAISettingsStore()

  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('gpt-4o')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await aiSettingsApi.getSettings()
      if (response.data) {
        setApiKey('')
        setBaseUrl(response.data.baseUrl || 'https://api.openai.com/v1')
        setModel(response.data.model || 'gpt-4o')
        setTemperature(response.data.temperature || 0.7)
        setMaxTokens(response.data.maxTokens || 2000)
        setSettings({
          baseUrl: response.data.baseUrl,
          model: response.data.model,
          temperature: response.data.temperature,
          maxTokens: response.data.maxTokens,
          isActive: response.data.isActive,
        })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await aiSettingsApi.updateSettings({
        apiKey,
        baseUrl,
        model,
        temperature,
        maxTokens,
      })
      setSettings({
        apiKey: apiKey ? '****' : '',
        baseUrl,
        model,
        temperature,
        maxTokens,
        isActive: true,
      })
      alert('AI设置已保存')
    } catch (error: any) {
      alert(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!apiKey || !baseUrl || !model) {
      alert('请填写完整的API配置后再测试')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const response = await aiSettingsApi.testConnection({
        apiKey,
        baseUrl,
        model,
      })
      setTestResult(response.data)
    } catch (error: any) {
      setTestResult({
        connected: false,
        model,
        error: error.response?.data?.error || error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleProviderSelect = (url: string) => {
    setBaseUrl(url)
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="font-heading text-2xl font-semibold text-foreground m-0">AI 设置</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        配置您的AI API以启用对话功能。支持所有OpenAI兼容的API接口。
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* API 提供商选择 */}
          {apiProviderGroups.map((group) => (
            <Card key={group.title} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <group.icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground m-0">{group.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.providers.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleProviderSelect(provider.url)}
                  >
                    {provider.name}
                  </Button>
                ))}
              </div>
            </Card>
          ))}

          {/* 配置表单 */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  className="mt-2"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div>
                <Label>API Base URL</Label>
                <Input
                  className="mt-2"
                  placeholder="https://api.openai.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>模型</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="选择或输入模型名称" />
                </SelectTrigger>
                <SelectContent>
                  {popularModels.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.group} - {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Temperature (温度)</Label>
                <Input
                  type="number"
                  className="mt-2"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Max Tokens (最大生成长度)</Label>
                <Input
                  type="number"
                  className="mt-2"
                  min={100}
                  max={8000}
                  step={100}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} loading={loading}>
                保存设置
              </Button>
              <Button variant="outline" onClick={handleTest} loading={testing}>
                <Zap className="w-4 h-4 mr-2" />
                测试连接
              </Button>
            </div>
          </Card>

          {/* 测试结果 */}
          {testResult && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                {testResult.connected ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    连接成功
                  </Badge>
                ) : (
                  <Badge variant="error" className="flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    连接失败
                  </Badge>
                )}
                <span className="text-foreground">模型: {testResult.model}</span>
              </div>
              {testResult.connected ? (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>响应时间: {testResult.responseTime?.toFixed(2)}秒</p>
                  <p className="mt-1">响应预览: {testResult.response}</p>
                </div>
              ) : (
                <Alert variant="error" className="mt-3">
                  {testResult.error}
                </Alert>
              )}
            </Card>
          )}

          {/* 本地部署指南 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Laptop className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-medium text-foreground m-0">本地部署指南</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground">Ollama 本地部署（推荐）</p>
                <p className="text-muted-foreground mt-1">
                  1. 下载安装 Ollama: <a href="https://ollama.com/download" target="_blank" rel="noopener" className="text-primary hover:underline">ollama.com/download</a><br/>
                  2. 运行模型: <code className="bg-muted px-1.5 py-0.5 rounded">ollama run llama3</code><br/>
                  3. 在上方填写: Base URL = http://localhost:11434/v1，Model = llama3
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">LM Studio 本地部署</p>
                <p className="text-muted-foreground mt-1">
                  1. 下载安装 LM Studio: <a href="https://lmstudio.ai/" target="_blank" rel="noopener" className="text-primary hover:underline">lmstudio.ai</a><br/>
                  2. 在软件中搜索并下载模型<br/>
                  3. 启动本地服务器 (默认端口 1234)<br/>
                  4. 在上方填写: Base URL = http://localhost:1234/v1
                </p>
              </div>
            </div>
          </Card>

          {/* 安全提示 */}
          <Alert variant="info" title="安全提示">
            您的API密钥将被加密存储在本地数据库中，仅用于与AI服务通信。我们不会将您的密钥发送到任何第三方服务。
          </Alert>
        </div>
      )}
    </div>
  )
}

export default Settings