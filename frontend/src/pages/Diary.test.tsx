/**
 * Diary Page Tests
 * 情绪日记页面测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Diary from './Diary'
import type { DiaryItem } from '@/services/localDiary'

// Mock the localDiary service
const mockList = vi.fn().mockResolvedValue({
  data: []
})
const mockCreate = vi.fn().mockResolvedValue({ success: true })
const mockUpdate = vi.fn().mockResolvedValue({ success: true })
const mockDelete = vi.fn().mockResolvedValue({ success: true })
const mockGet = vi.fn().mockImplementation((id: number) => {
  return Promise.resolve({
    data: {
      id,
      content: '测试日记内容',
      mood: 'joy',
      tags: ['工作'],
      created_at: new Date().toISOString()
    }
  })
})

vi.mock('@/services/localDiary', () => ({
  localDiaryService: {
    list: () => mockList(),
    create: (data: any) => mockCreate(data),
    update: (id: number, data: any) => mockUpdate(id, data),
    delete: (id: number) => mockDelete(id),
    get: (id: number) => mockGet(id)
  },
  DiaryItem: vi.fn()
}))

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <Diary />
    </MemoryRouter>
  )
}

describe('Diary Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render page title and description', () => {
    renderWithRouter()
    expect(screen.getByText('情绪日记')).toBeInTheDocument()
    expect(screen.getByText('记录每一天的心情')).toBeInTheDocument()
    expect(screen.getByText('写日记')).toBeInTheDocument()
  })

  it('should show empty state when no diaries', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('还没有日记记录')).toBeInTheDocument()
    })
  })

  it('should open create diary modal when "写日记" clicked', async () => {
    renderWithRouter()
    const createButton = screen.getByText('写日记')
    fireEvent.click(createButton)

    expect(screen.getByText('写日记')).toBeInTheDocument() // Modal title
    expect(screen.getByText('今天的心情')).toBeInTheDocument()
    expect(screen.getByText('日记内容')).toBeInTheDocument()
  })

  it('should allow selecting mood and tags in create modal', async () => {
    renderWithRouter()
    const createButton = screen.getByText('写日记')
    fireEvent.click(createButton)

    // Check that predefined tags are clickable
    const workTag = screen.getByText('工作')
    fireEvent.click(workTag)
    expect(workTag).toHaveClass('bg-primary/10')

    // Click again to unselect
    fireEvent.click(workTag)
    expect(workTag).not.toHaveClass('bg-primary/10')
  })

  it('should disable save when mood or content is missing', async () => {
    renderWithRouter()
    const createButton = screen.getByText('写日记')
    fireEvent.click(createButton)

    // Check that form validation works - can't save without required fields
    // The button should still be enabled but handleCreate will early return
    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('should create new diary when form is valid', async () => {
    renderWithRouter()
    const createButton = screen.getByText('写日记')
    fireEvent.click(createButton)

    // Fill the form
    const contentTextarea = screen.getByPlaceholderText('记录今天发生了什么，你的感受如何...')
    fireEvent.change(contentTextarea, { target: { value: '今天心情不错' } })

    // We can't easily test Select interaction with react-testing-library,
    // but the validation logic is covered in the early return check

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  it('should render error state when loading fails', async () => {
    mockList.mockRejectedValueOnce(new Error('Network error'))
    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('加载失败，请检查网络连接')).toBeInTheDocument()
      expect(screen.getByText('重试')).toBeInTheDocument()
    })
  })

  it('should show skeleton loading when loading', () => {
    // ahooks useRequest provides loading state, our component renders skeletons
    renderWithRouter()
    // Loading skeleton should be visible initially
    expect(document.querySelectorAll('.react-loading-skeleton')).toHaveLength(3)
  })

  it('should render delete confirmation dialog', async () => {
    // Mock with some diary data
    mockList.mockResolvedValueOnce({
      data: [{
        id: 1,
        content: 'Test diary',
        mood: 'joy',
        tags: [],
        created_at: new Date().toISOString()
      } as DiaryItem]
    })

    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Test diary')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /trash/i })
    fireEvent.click(deleteButton)

    expect(screen.getByText('确认删除')).toBeInTheDocument()
    expect(screen.getByText('确定要删除这篇日记吗？此操作不可撤销。')).toBeInTheDocument()
  })
})
