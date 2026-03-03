import React, { useState } from 'react'
import { Card, Form, Input, Button, Checkbox, Typography, Space, Alert, message, Modal } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { authApi } from '../services/api'

const { Title, Text, Paragraph } = Typography

const DISCLAIMER_CONTENT = `
## HeartMirror 心镜 - 免责声明

欢迎使用HeartMirror（心镜）心理健康自助管理系统。

### 重要声明
1. 本产品为心理健康自助管理工具，不替代临床诊断和治疗。
2. 所有评估结果仅供参考，不作为医疗诊断依据。
3. 如有严重心理问题，请及时寻求专业医疗帮助。

### 紧急情况
如果您正处于危机状态，请拨打：
- 全国心理援助热线：400-161-9995
- 紧急求助：120 或 110

### 数据安全
我们采用端到端加密保护您的隐私数据。

使用本产品即表示您已阅读并同意以上声明。
`

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const { run: register, loading } = useRequest(
    (values) => authApi.register(values),
    {
      manual: true,
      onSuccess: () => {
        message.success('注册成功，请登录')
        navigate('/login')
      },
      onError: (error: any) => {
        message.error(error.response?.data?.detail || '注册失败')
      },
    }
  )

  const handleSubmit = (values: any) => {
    if (!values.consent_given || !values.disclaimer_accepted) {
      message.error('请同意服务条款和免责声明')
      return
    }

    register({
      anonymous_id: values.anonymous_id,
      password: values.password,
      consent_given: values.consent_given,
      disclaimer_accepted: values.disclaimer_accepted,
    })
  }

  const generateAnonymousId = () => {
    const adjectives = ['快乐', '温暖', '阳光', '星空', '晨曦', '清风', '明月', '静心']
    const nouns = ['小鹿', '飞鸟', '流星', '微风', '云朵', '蝴蝶', '浪花', '樱花']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 1000)
    return `${adj}${noun}${num}`
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              注册账号
            </Title>
            <Text type="secondary">创建您的匿名账号</Text>
          </div>

          <Alert
            message="匿名注册"
            description="我们采用匿名机制保护您的隐私，请设置一个匿名ID作为您的标识。"
            type="info"
            showIcon
          />

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{
              anonymous_id: generateAnonymousId(),
            }}
          >
            <Form.Item
              name="anonymous_id"
              label="匿名ID"
              rules={[
                { required: true, message: '请输入匿名ID' },
                { min: 3, message: 'ID至少3个字符' },
                { max: 20, message: 'ID最多20个字符' },
              ]}
              extra="这是我们识别您的唯一标识，请牢记"
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="您的匿名ID"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="设置密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="再次输入密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="consent_given"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('请同意隐私政策')),
                },
              ]}
            >
              <Checkbox>
                我已阅读并同意
                <Button type="link" style={{ padding: '0 4px' }}>
                  隐私政策
                </Button>
              </Checkbox>
            </Form.Item>

            <Form.Item
              name="disclaimer_accepted"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意免责声明')),
                },
              ]}
            >
              <Checkbox>
                我已阅读并同意
                <Button
                  type="link"
                  style={{ padding: '0 4px' }}
                  onClick={() => setShowDisclaimer(true)}
                >
                  免责声明
                </Button>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              已有账号？ <Link to="/login">立即登录</Link>
            </Text>
          </div>
        </Space>
      </Card>

      <Modal
        title="免责声明"
        open={showDisclaimer}
        onCancel={() => setShowDisclaimer(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDisclaimer(false)}>
            取消
          </Button>,
          <Button
            key="agree"
            type="primary"
            onClick={() => {
              form.setFieldValue('disclaimer_accepted', true)
              setShowDisclaimer(false)
            }}
          >
            我已阅读并同意
          </Button>,
        ]}
        width={600}
      >
        <div style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
          {DISCLAIMER_CONTENT}
        </div>
      </Modal>
    </div>
  )
}

export default Register