import React, { useState } from 'react'
import { Card, Form, Input, Button, Checkbox, Typography, Space, Alert, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const { Title, Text, Paragraph } = Typography

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form] = Form.useForm()

  const { run: login, loading } = useRequest(
    (values) => authApi.login(values),
    {
      manual: true,
      onSuccess: (response) => {
        const { access_token, user } = response.data
        setAuth(access_token, user)
        message.success('登录成功')
        navigate('/')
      },
      onError: (error: any) => {
        message.error(error.response?.data?.detail || '登录失败')
      },
    }
  )

  const handleSubmit = (values: any) => {
    login({
      anonymous_id: values.anonymous_id,
      password: values.password,
    })
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
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              HeartMirror
            </Title>
            <Text type="secondary">心理健康自助管理系统</Text>
          </div>

          <Alert
            message="重要声明"
            description="本产品为心理健康自助管理工具，不替代临床诊断和治疗。"
            type="warning"
            showIcon
            closable
          />

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{ remember: true }}
          >
            <Form.Item
              name="anonymous_id"
              rules={[{ required: true, message: '请输入匿名ID' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="匿名ID"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Checkbox name="remember">记住我</Checkbox>
              </Space>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账号？ <Link to="/register">立即注册</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Login