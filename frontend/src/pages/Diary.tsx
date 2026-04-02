/**
 * Diary Page
 * 情绪日记页面 - 使用 Tailwind + shadcn/ui
 */

import React, { useState } from 'react'
import { useRequest } from 'ahooks'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { localDiaryService, DiaryItem } from '@/services/localDiary'
import { MOOD_CONFIG } from '@/components/common/MoodIcons'
import {
  Button,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Label,
  Skeleton,
  Spinner
} from '@/components/ui'
import { cn } from '@/lib/utils'

// 心情选项
const moodOptions = MOOD_CONFIG.map(mood => ({
  value: mood.value,
  label: mood.label,
  color: mood.color === 'var(--emotion-joy)' ? 'joy' :
         mood.color === 'var(--emotion-calm)' ? 'calm' :
         mood.color === 'var(--emotion-sadness)' ? 'sadness' :
         mood.color === 'var(--emotion-anxiety)' ? 'anxiety' :
         mood.color === 'var(--emotion-anger)' ? 'anger' : 'default',
}))

const Diary: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDiary, setSelectedDiary] = useState<DiaryItem | null>(null)
  const [editingDiary, setEditingDiary] = useState<DiaryItem | null>(null)
  const [formMood, setFormMood] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [formContent, setFormContent] = useState('')
  const [editMood, setEditMood] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [diaryToDelete, setDiaryToDelete] = useState<DiaryItem | null>(null)

  // 获取日记列表
  const { data: diaries, loading, refresh, error } = useRequest(() => localDiaryService.list(), {
    onError: (err) => {
      console.error('获取日记列表失败', err)
    },
  })

  // 创建日记
  const handleCreate = async () => {
    if (!formMood || !formContent.trim()) return

    setSubmitting(true)
    try {
      await localDiaryService.create({
        content: formContent,
        mood: formMood,
        tags: formTags,
      })
      setIsModalOpen(false)
      setFormMood('')
      setFormTags([])
      setFormContent('')
      refresh()
    } catch (error) {
      console.error('创建失败', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 更新日记
  const handleUpdate = async () => {
    if (!editingDiary || !editMood || !editContent.trim()) return

    setSubmitting(true)
    try {
      await localDiaryService.update(editingDiary.id, {
        content: editContent,
        mood: editMood,
        tags: editTags,
      })
      setIsEditModalOpen(false)
      setEditingDiary(null)
      refresh()
    } catch (error) {
      console.error('更新失败', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 删除日记
  const handleDelete = async () => {
    if (!diaryToDelete) return

    try {
      await localDiaryService.delete(diaryToDelete.id)
      setDeleteDialogOpen(false)
      setDiaryToDelete(null)
      refresh()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  // 查看日记详情
  const handleView = async (diary: DiaryItem) => {
    setSelectedDiary(diary)
  }

  // 打开编辑弹窗
  const handleEdit = async (diary: DiaryItem) => {
    try {
      const res = await localDiaryService.get(diary.id)
      if (res.data) {
        setEditingDiary(res.data)
        setEditMood(res.data.mood)
        setEditTags(res.data.tags || [])
        setEditContent(res.data.content || '')
        setIsEditModalOpen(true)
      }
    } catch (error) {
      console.error('获取日记详情失败', error)
    }
  }

  const diaryList = Array.isArray(diaries?.data) ? diaries.data : []

  const getMoodLabel = (mood: string) => {
    const option = moodOptions.find((opt) => opt.value === mood)
    return option || { label: mood, color: 'default' }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground m-0">
            情绪日记
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            记录每一天的心情
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          写日记
        </Button>
      </div>

      {/* 日记列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton rows={2} />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">加载失败，请检查网络连接</p>
          <Button onClick={() => refresh()}>重试</Button>
        </Card>
      ) : diaryList.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">还没有日记记录</p>
          <Button onClick={() => setIsModalOpen(true)}>写第一篇日记</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {diaryList.map((diary: DiaryItem) => {
            const mood = getMoodLabel(diary.mood)
            return (
              <Card
                key={diary.id}
                className="p-6 cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => handleView(diary)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge variant={mood.color as any}>{mood.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(diary.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(diary)
                      }}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDiaryToDelete(diary)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  </div>
                </div>
                {diary.tags?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {diary.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* 创建日记弹窗 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>写日记</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>今天的心情</Label>
              <Select value={formMood} onValueChange={setFormMood}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="选择今天的心情" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>标签</Label>
              <Select value={formTags[0] || ''} onValueChange={(v) => setFormTags(v ? [v] : [])}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="添加标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="工作">工作</SelectItem>
                  <SelectItem value="学习">学习</SelectItem>
                  <SelectItem value="人际关系">人际关系</SelectItem>
                  <SelectItem value="家庭">家庭</SelectItem>
                  <SelectItem value="健康">健康</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>日记内容</Label>
              <Textarea
                className="mt-2 font-diary text-lg"
                rows={6}
                placeholder="记录今天发生了什么，你的感受如何..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate} loading={submitting}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日记详情弹窗 */}
      <Dialog open={!!selectedDiary} onOpenChange={() => setSelectedDiary(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>日记详情</DialogTitle>
          </DialogHeader>
          {selectedDiary && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={getMoodLabel(selectedDiary.mood).color as any}>
                  {getMoodLabel(selectedDiary.mood).label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedDiary.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              {selectedDiary.tags?.length > 0 && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  {selectedDiary.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="bg-muted rounded-lg p-6">
                <p className="font-diary text-xl leading-relaxed text-foreground whitespace-pre-wrap m-0">
                  {selectedDiary.content}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDiary(null)}>关闭</Button>
            <Button onClick={() => {
              if (selectedDiary) {
                setSelectedDiary(null)
                handleEdit(selectedDiary)
              }
            }}>编辑</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑日记弹窗 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑日记</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>心情</Label>
              <Select value={editMood} onValueChange={setEditMood}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="选择心情" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>标签</Label>
              <Select value={editTags[0] || ''} onValueChange={(v) => setEditTags(v ? [v] : [])}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="添加标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="工作">工作</SelectItem>
                  <SelectItem value="学习">学习</SelectItem>
                  <SelectItem value="人际关系">人际关系</SelectItem>
                  <SelectItem value="家庭">家庭</SelectItem>
                  <SelectItem value="健康">健康</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>日记内容</Label>
              <Textarea
                className="mt-2 font-diary text-lg"
                rows={6}
                placeholder="记录今天发生了什么，你的感受如何..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>取消</Button>
            <Button onClick={handleUpdate} loading={submitting}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">确定要删除这篇日记吗？此操作不可撤销。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Diary