import React, { useState } from 'react'
import { Card, Button, Input, Space, Typography, message, Modal, Form, DatePicker, Select, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { diaryApi } from '../services/api'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface DiaryItem {
  id: string
  mood: string
  tags: string[]
  emotion: string
  emotion_intensity: number
  created_at: string
  content?: string
}

const moodOptions = [
  { value: 'joy', label: '😊 开心', color: 'gold' },
  { value: 'calm', label: '😌 平静', color: 'green' },
  { value: 'sadness', label: '😢 悲伤', color: 'blue' },
  { value: 'anxiety', label: '😰 焦虑', color: 'orange' },
  { value: 'anger', label: '😠 愤怒', color: 'red' },
  { value: 'fear', label: '😨 恐惧', color: 'purple' },
  { value: 'neutral', label: '😐 中性', color: 'default' },
]

const Diary: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [selectedDiary, setSelectedDiary] = useState<DiaryItem | null>(null)
  const [editingDiary, setEditingDiary] = useState<DiaryItem | null>(null)

  // 获取日记列表
  const { data: diaries, loading, refresh, error } = useRequest(() => diaryApi.list(), {
    onError: (err) => {
      console.error('获取日记列表失败', err)
    },
  })

  // 创建日记
  const { run: createDiary, loading: creating } = useRequest(
    (values) => diaryApi.create(values),
    {
      manual: true,
      onSuccess: () => {
        message.success('日记创建成功')
        setIsModalOpen(false)
        form.resetFields()
        refresh()
      },
      onError: () => {
        message.error('创建失败，请重试')
      },
    }
  )

  // 更新日记
  const { run: updateDiary, loading: updating } = useRequest(
    (id, values) => diaryApi.update(id, values),
    {
      manual: true,
      onSuccess: () => {
        message.success('日记更新成功')
        setIsEditModalOpen(false)
        editForm.resetFields()
        setEditingDiary(null)
        refresh()
      },
      onError: () => {
        message.error('更新失败，请重试')
      },
    }
  )

  // 删除日记
  const { run: deleteDiary } = useRequest((id) => diaryApi.delete(id), {
    manual: true,
    onSuccess: () => {
      message.success('删除成功')
      refresh()
    },
    onError: (err) => {
      console.error('删除失败', err)
      message.error('删除失败，请重试')
    },
  })

  // 确认删除
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇日记吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteDiary(id),
    })
  }

  // 查看日记详情
  const { run: viewDiary } = useRequest((id) => diaryApi.get(id), {
    manual: true,
    onSuccess: (response) => {
      setSelectedDiary(response.data)
    },
    onError: (err) => {
      console.error('获取日记详情失败', err)
      message.error('获取日记详情失败，请重试')
    },
  })

  const handleSubmit = (values: any) => {
    createDiary({
      content: values.content,
      mood: values.mood,
      tags: values.tags,
    })
  }

  // 打开编辑弹窗
  const handleEdit = (diary: DiaryItem) => {
    setEditingDiary(diary)
    editForm.setFieldsValue({
      mood: diary.mood,
      tags: diary.tags,
      content: diary.content,
    })
    setIsEditModalOpen(true)
  }

  // 提交编辑
  const handleEditSubmit = (values: any) => {
    if (editingDiary) {
      updateDiary(editingDiary.id, {
        content: values.content,
        mood: values.mood,
        tags: values.tags,
      })
    }
  }

  const getMoodLabel = (mood: string) => {
    const option = moodOptions.find((opt) => opt.value === mood)
    return option || { label: mood, color: 'default' }
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              情绪日记
            </Title>
            <Text type="secondary">记录每一天的心情</Text>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            写日记
          </Button>
        }
      >
        {loading ? (
          <Text>加载中...</Text>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Paragraph type="secondary">加载失败，请检查网络连接</Paragraph>
            <Button type="primary" onClick={() => refresh()}>
              重试
            </Button>
          </div>
        ) : diaries?.data?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Paragraph type="secondary">还没有日记记录</Paragraph>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              写第一篇日记
            </Button>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {diaries?.data?.map((diary: DiaryItem) => {
              const mood = getMoodLabel(diary.mood)
              return (
                <Card
                  key={diary.id}
                  size="small"
                  hoverable
                  onClick={() => viewDiary(diary.id)}
                  extra={
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          // 先获取详情再编辑
                          diaryApi.get(diary.id)
                            .then(res => {
                              handleEdit(res.data)
                            })
                            .catch(err => {
                              console.error('获取日记详情失败', err)
                              message.error('获取日记详情失败，请重试')
                            })
                        }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(diary.id)
                        }}
                      />
                    </Space>
                  }
                >
                  <Space>
                    <Tag color={mood.color}>{mood.label}</Tag>
                    <Text type="secondary">
                      {new Date(diary.created_at).toLocaleDateString('zh-CN')}
                    </Text>
                  </Space>
                  {diary.tags?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {diary.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </Space>
        )}
      </Card>

      {/* 创建日记弹窗 */}
      <Modal
        title="写日记"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="mood"
            label="今天的心情"
            rules={[{ required: true, message: '请选择心情' }]}
          >
            <Select placeholder="选择今天的心情">
              {moodOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签，如：工作、学习、人际关系">
              <Option value="工作">工作</Option>
              <Option value="学习">学习</Option>
              <Option value="人际关系">人际关系</Option>
              <Option value="家庭">家庭</Option>
              <Option value="健康">健康</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="日记内容"
            rules={[{ required: true, message: '请输入日记内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="记录今天发生了什么，你的感受如何..."
              showCount
              maxLength={2000}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={creating}>
                保存
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 日记详情弹窗 */}
      <Modal
        title="日记详情"
        open={!!selectedDiary}
        onCancel={() => setSelectedDiary(null)}
        footer={
          <Space>
            <Button onClick={() => setSelectedDiary(null)}>关闭</Button>
            <Button
              type="primary"
              onClick={() => {
                if (selectedDiary) {
                  setSelectedDiary(null)
                  handleEdit(selectedDiary)
                }
              }}
            >
              编辑
            </Button>
          </Space>
        }
      >
        {selectedDiary && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getMoodLabel(selectedDiary.mood).color}>
                {getMoodLabel(selectedDiary.mood).label}
              </Tag>
              <Text type="secondary">
                {new Date(selectedDiary.created_at).toLocaleString('zh-CN')}
              </Text>
            </Space>
            {selectedDiary.tags?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {selectedDiary.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </div>
            )}
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {selectedDiary.content}
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* 编辑日记弹窗 */}
      <Modal
        title="编辑日记"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingDiary(null)
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="mood"
            label="心情"
            rules={[{ required: true, message: '请选择心情' }]}
          >
            <Select placeholder="选择心情">
              {moodOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="添加标签">
              <Option value="工作">工作</Option>
              <Option value="学习">学习</Option>
              <Option value="人际关系">人际关系</Option>
              <Option value="家庭">家庭</Option>
              <Option value="健康">健康</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="日记内容"
            rules={[{ required: true, message: '请输入日记内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="记录今天发生了什么，你的感受如何..."
              showCount
              maxLength={2000}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updating}>
                保存修改
              </Button>
              <Button onClick={() => {
                setIsEditModalOpen(false)
                setEditingDiary(null)
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Diary