/**
 * EmotionChart Component
 * 情绪分布饼图组件
 */

import React from 'react'
import { Card } from 'antd'
import ReactECharts from 'echarts-for-react'

interface EmotionChartProps {
  data?: Record<string, number>
  loading?: boolean
  height?: number
}

const emotionColors: Record<string, string> = {
  joy: '#ffd666',
  happiness: '#ffd666',
  sadness: '#69c0ff',
  anger: '#ff7875',
  fear: '#b37feb',
  anxiety: '#ffa940',
  neutral: '#95de64',
  surprise: '#5cdbd3'
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
  height = 300
}) => {
  const chartOption = {
    title: {
      text: '情绪分布',
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll'
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
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}'
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
    <Card
      loading={loading}
      style={{ borderRadius: 12, height: '100%' }}
      bodyStyle={{ padding: 16 }}
    >
      <ReactECharts
        option={chartOption}
        style={{ height }}
        opts={{ renderer: 'svg' }}
      />
    </Card>
  )
}

export default EmotionChart