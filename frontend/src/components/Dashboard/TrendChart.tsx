/**
 * TrendChart Component
 * 情绪趋势折线图组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import ReactECharts from 'echarts-for-react'
import { cn } from '@/lib/utils'

interface TrendData {
  date: string
  average_intensity: number
}

interface TrendChartProps {
  data?: TrendData[]
  loading?: boolean
  height?: number
  className?: string
}

const TrendChart: React.FC<TrendChartProps> = ({
  data = [],
  loading = false,
  height = 300,
  className
}) => {
  const primaryColor = '#8B5CF6' // lavender from design system

  const chartOption = {
    title: {
      text: '情绪趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontFamily: 'var(--font-heading)',
        color: 'var(--text-primary)'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `${point.axisValue}<br/>情绪强度: ${(point.value * 100).toFixed(0)}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisLine: { lineStyle: { color: 'var(--color-border)' } },
      axisLabel: { color: 'var(--text-secondary)' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      splitLine: { lineStyle: { color: 'var(--color-border-muted)' } },
      axisLabel: {
        color: 'var(--text-secondary)',
        formatter: (value: number) => `${(value * 100).toFixed(0)}%`
      }
    },
    series: [
      {
        name: '情绪强度',
        type: 'line',
        data: data.map((item) => item.average_intensity),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: primaryColor,
          width: 3
        },
        itemStyle: {
          color: primaryColor
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
            ]
          }
        }
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

export default TrendChart