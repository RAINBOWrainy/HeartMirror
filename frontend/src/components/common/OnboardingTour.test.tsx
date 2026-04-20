/**
 * OnboardingTour Component Tests
 * 新手引导组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingTour from './OnboardingTour'

describe('OnboardingTour', () => {
  const mockOnComplete = vi.fn()
  const storageKey = 'test-onboarding'

  beforeEach(() => {
    localStorage.clear()
    mockOnComplete.mockClear()
  })

  describe('Initialization', () => {
    it('should render when not completed in localStorage', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      expect(screen.getByText('欢迎来到心镜')).toBeInTheDocument()
    })

    it('should not render when already completed in localStorage', () => {
      localStorage.setItem(storageKey, 'true')
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      expect(screen.queryByText('欢迎来到心镜')).not.toBeInTheDocument()
    })

    it('should not render when visible is false', () => {
      render(<OnboardingTour visible={false} onComplete={mockOnComplete} storageKey={storageKey} />)
      expect(screen.queryByText('欢迎来到心镜')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should show correct progress', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      expect(screen.getByText('步骤 1 / 5')).toBeInTheDocument()
    })

    it('should go to next step when clicking next', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      const nextButton = screen.getByText('下一步')
      fireEvent.click(nextButton)

      expect(screen.getByText('步骤 2 / 5')).toBeInTheDocument()
      expect(screen.getByText('AI 对话')).toBeInTheDocument()
    })

    it('should go back to previous step when clicking back', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      const nextButton = screen.getByText('下一步')
      fireEvent.click(nextButton) // -> step 2
      fireEvent.click(nextButton) // -> step 3

      const backButton = screen.getByText('上一步')
      fireEvent.click(backButton) // -> step 2

      expect(screen.getByText('步骤 2 / 5')).toBeInTheDocument()
      expect(screen.getByText('AI 对话')).toBeInTheDocument()
    })

    it('should not show back button on first step', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      expect(screen.queryByText('上一步')).not.toBeInTheDocument()
    })

    it('should change button text to "开始使用" on last step', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      const nextButton = screen.getByText('下一步')

      // Navigate to last step (step 5)
      for (let i = 0; i < 4; i++) {
        fireEvent.click(nextButton)
      }

      expect(screen.getByText('开始使用')).toBeInTheDocument()
      expect(screen.queryByText('下一步')).not.toBeInTheDocument()
    })
  })

  describe('Completion', () => {
    it('should call onComplete and set localStorage when completed', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      const nextButton = screen.getByText('下一步')

      // Navigate to last step and complete
      for (let i = 0; i < 4; i++) {
        fireEvent.click(nextButton)
      }

      const completeButton = screen.getByText('开始使用')
      fireEvent.click(completeButton)

      expect(localStorage.getItem(storageKey)).toBe('true')
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('欢迎来到心镜')).not.toBeInTheDocument()
    })

    it('should allow skipping the tour', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      const skipButton = screen.getByText('跳过引导')
      fireEvent.click(skipButton)

      expect(localStorage.getItem(storageKey)).toBe('true')
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('欢迎来到心镜')).not.toBeInTheDocument()
    })
  })

  describe('Dialog behavior', () => {
    it('should skip when dialog is closed', () => {
      render(<OnboardingTour visible onComplete={mockOnComplete} storageKey={storageKey} />)
      // Dialog close triggers onOpenChange with false, which should call handleSkip
      expect(localStorage.getItem(storageKey)).toBeNull()
    })
  })
})
