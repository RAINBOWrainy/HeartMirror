/**
 * EmotionChart Component
 * 情绪分布饼图组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

interface EmotionChartProps {
  data?: Record<string, number>
  loading?: boolean
  height?: number
  className?: string
}

const emotionColors: Record<string, string> = {
  joy: '#FBBF24',
  happiness: '#FBBF24',
  sadness: '#6366F1',
  anger: '#EF4444',
  fear: '#8B5CF6',
  anxiety: '#F97316',
  neutral: '#10B981',
  surprise: '#22D3EE'
}

const emotionLabels: Record<string, string> = {
  joy: '喜悦',
  happiness: '快乐',
  sadness: '悲伤',
  anger: '愤怒',
  fear: '恐惧',
  anxiety: '焦虑',
  neutral: '平静',
  surprise: '惊讶'
}

const EmotionChart: React.FC<EmotionChartProps> = ({
  data = {},
  loading = false,
  height = 300,
  className
}) => {
  const chartOption = {
    title: {
      text: '情绪分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontFamily: 'var(--font-heading)',
        color: 'var(--text-primary)'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll',
      textStyle: {
        color: 'var(--text-secondary)'
      }
    },
    series: [
      {
        name: '情绪',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--color-surface)',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}',
          color: 'var(--text-primary)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: Object.entries(data).map(([name, value]) => ({
          name: emotionLabels[name] || name,
          value,
          itemStyle: {
            color: emotionColors[name] || '#8c8c8c'
          }
        }))
      }
    ]
  }

  return (
    <div
      className={cn(
        'bg-surface rounded-lg border border-border p-4 h-full',
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-pulse text-muted-foreground">加载中...</div>
        </div>
      ) : (
        <ReactECharts
          option={chartOption}
          style={{ height }}
          opts={{ renderer: 'svg' }}
        />
      )}
    </div>
  )
}

export default EmotionChart