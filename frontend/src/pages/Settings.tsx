import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  message,
  Space,
  Divider,
  Alert,
  Spin,
  Typography,
  Tag,
} from 'antd'
import {
  SettingOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { aiSettingsApi, TestConnectionResponse } from '../services/aiSettings'
import { useAISettingsStore } from '../stores/aiSettingsStore'

const { Title, Text, Paragraph } = Typography
const { Password } = Input

/**
 * AI设置页面
 * 用户可以在此配置自己的AI API Key、Base URL和模型
 * 参考JadeAI的设计模式
 */
const Settings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null)
  const { settings, setSettings } = useAISettingsStore()

  // 常用模型列表
  const popularModels = [
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
    { label: 'GLM-4', value: 'glm-4' },
    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
    { label: 'Qwen Turbo', value: 'qwen-turbo' },
    { label: '自定义模型', value: 'custom' },
  ]

  // 常用API提供商
  const apiProviders = [
    { name: 'OpenAI', url: 'https://api.openai.com/v1' },
    { name: 'Azure OpenAI', url: 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments' },
    { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1' },
    { name: 'Anthropic', url: 'https://api.anthropic.com/v1' },
    { name: '智谱AI', url: 'https://open.bigmodel.cn/api/paas/v4' },
    { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
    { name: '通义千问', url: 'https://dashscope.aliyuncs.com/api/v1' },
    { name: '本地部署', url: 'http://localhost:11434/v1' },
  ]

  useEffect(() => {
    // 加载保存的设置
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await aiSettingsApi.getSettings()
      if (response.data) {
        form.setFieldsValue({
          apiKey: '', // 不回显API Key
          baseUrl: response.data.baseUrl || 'https://api.openai.com/v1',
          model: response.data.model || 'gpt-3.5-turbo',
          temperature: response.data.temperature || 0.7,
          maxTokens: response.data.maxTokens || 2000,
        })
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

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      await aiSettingsApi.updateSettings({
        apiKey: values.apiKey,
        baseUrl: values.baseUrl,
        model: values.model,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
      })
      setSettings({
        apiKey: values.apiKey ? '****' : '', // 本地不保存完整key
        baseUrl: values.baseUrl,
        model: values.model,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        isActive: true,
      })
      message.success('AI设置已保存')
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    const values = form.getFieldsValue()
    if (!values.apiKey || !values.baseUrl || !values.model) {
      message.warning('请填写完整的API配置后再测试')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const response = await aiSettingsApi.testConnection({
        apiKey: values.apiKey,
        baseUrl: values.baseUrl,
        model: values.model,
      })
      setTestResult(response.data)
      if (response.data.connected) {
        message.success('连接测试成功！')
      } else {
        message.error('连接测试失败')
      }
    } catch (error: any) {
      setTestResult({
        connected: false,
        model: values.model,
        error: error.response?.data?.error || error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleProviderSelect = (url: string) => {
    form.setFieldValue('baseUrl', url)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>
        <SettingOutlined /> AI 设置
      </Title>
      <Paragraph type="secondary">
        在此配置您自己的AI API。您的API密钥将被安全存储，仅用于与AI服务通信。
      </Paragraph>

      <Divider />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 2000,
          }}
        >
          {/* 快捷选择API提供商 */}
          <Card title="快捷选择API提供商" size="small" style={{ marginBottom: 24 }}>
            <Space wrap>
              {apiProviders.map((provider) => (
                <Button
                  key={provider.name}
                  size="small"
                  onClick={() => handleProviderSelect(provider.url)}
                >
                  {provider.name}
                </Button>
              ))}
            </Space>
          </Card>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: false, message: '请输入API密钥' }]}
          >
            <Password
              placeholder="sk-..."
              prefix={<ApiOutlined />}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="API Base URL"
            rules={[{ required: true, message: '请输入API地址' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="model"
            label="模型"
            rules={[{ required: true, message: '请选择或输入模型名称' }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="选择或输入模型名称"
              options={popularModels}
              allowClear
            />
          </Form.Item>

          <Form.Item label="Temperature (温度)" name="temperature">
            <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Max Tokens (最大生成长度)" name="maxTokens">
            <InputNumber min={100} max={8000} step={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
              <Button onClick={handleTest} loading={testing}>
                <ThunderboltOutlined /> 测试连接
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {/* 测试结果 */}
      {testResult && (
        <Card
          title={
            <Space>
              {testResult.connected ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  连接成功
                </Tag>
              ) : (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  连接失败
                </Tag>
              )}
              <span>模型: {testResult.model}</span>
            </Space>
          }
          size="small"
          style={{ marginTop: 16 }}
        >
          {testResult.connected ? (
            <div>
              <Text>响应时间: {testResult.responseTime?.toFixed(2)}秒</Text>
              <br />
              <Text type="secondary">响应预览: {testResult.response}</Text>
            </div>
          ) : (
            <Alert type="error" message={testResult.error} />
          )}
        </Card>
      )}

      <Divider />

      <Alert
        type="info"
        showIcon
        message="安全提示"
        description="您的API密钥将被加密存储在本地数据库中，仅用于与AI服务通信。我们不会将您的密钥发送到任何第三方服务。"
      />
    </div>
  )
}

export default Settings