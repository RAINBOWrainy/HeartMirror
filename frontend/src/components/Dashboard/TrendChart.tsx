/**
 * TrendChart Component
 * 情绪趋势折线图组件
 */

import React from 'react'
import { Card } from 'antd'
import ReactECharts from 'echarts-for-react'

interface TrendData {
  date: string
  average_intensity: number
}

interface TrendChartProps {
  data?: TrendData[]
  loading?: boolean
  height?: number
}

const TrendChart: React.FC<TrendChartProps> = ({
  data = [],
  loading = false,
  height = 300
}) => {
  const chartOption = {
    title: {
      text: '情绪趋势',
      left: 'center',
      textStyle: { fontSize: 16 }
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
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisLabel: { color: '#8c8c8c' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: {
        color: '#8c8c8c',
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
          color: '#1890ff',
          width: 3
        },
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
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

export default TrendChart