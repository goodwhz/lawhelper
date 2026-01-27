'use client'

import React from 'react'
import type { DimensionTrendData } from '@/types/evaluation'

interface EvaluationTrendChartProps {
  data: DimensionTrendData[]
}

const EvaluationTrendChart: React.FC<EvaluationTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-500">暂无趋势数据</p>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const width = 800
  const height = 350
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // 获取最大值和最小值
  const allValues = data.flatMap(d => [
    d.total_score,
    d.薪资回报,
    d.工作强度,
    d.成长空间,
    d.工作环境,
    d.团队氛围,
    d.心理健康,
  ].filter(Boolean))

  const minValue = 0
  const maxValue = Math.max(...allValues, 100)

  // 坐标转换函数
  const xScale = (index: number) => padding + (index / (data.length - 1)) * chartWidth
  const yScale = (value: number) => height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight

  // 生成路径
  const createPath = (key: keyof DimensionTrendData, color: string) => {
    const points = data.map((d, i) => {
      const value = d[key] as number
      if (value === undefined) { return null }
      return { x: xScale(i), y: yScale(value) }
    }).filter(Boolean) as { x: number, y: number }[]

    if (points.length === 0) { return null }

    const pathD = points.map((p, i) =>
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`,
    ).join(' ')

    return (
      <g key={String(key)}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
      </g>
    )
  }

  const dimensions = [
    { key: 'total_score' as const, label: '综合评分', color: '#ec4899' },
    { key: '薪资回报' as const, label: '薪资回报', color: '#3b82f6' },
    { key: '工作强度' as const, label: '工作强度', color: '#10b981' },
    { key: '成长空间' as const, label: '成长空间', color: '#f59e0b' },
    { key: '工作环境' as const, label: '工作环境', color: '#8b5cf6' },
    { key: '团队氛围' as const, label: '团队氛围', color: '#ef4444' },
    { key: '心理健康' as const, label: '心理健康', color: '#06b6d4' },
  ]

  // 网格线
  const gridLines = Array.from({ length: 6 }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / 5)
    const y = yScale(value)
    return (
      <g key={i}>
        <line
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text
          x={padding - 10}
          y={y + 4}
          textAnchor="end"
          fontSize={12}
          fill="#6b7280"
        >
          {value.toFixed(0)}
        </text>
      </g>
    )
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">评分变化趋势</h3>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* 背景网格 */}
        {gridLines}

        {/* Y轴 */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* X轴 */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* X轴标签 */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - padding + 20}
            textAnchor="middle"
            fontSize={12}
            fill="#6b7280"
          >
            {formatDate(d.date)}
          </text>
        ))}

        {/* 数据线 */}
        {dimensions
          .filter(dim => data.some(d => d[dim.key] !== undefined))
          .map(dim => createPath(dim.key, dim.color))
        }

        {/* 标题 */}
        <text x={width / 2} y={30} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#374151">
          测评分数变化
        </text>

        {/* 图例 */}
        {dimensions
          .filter(dim => data.some(d => d[dim.key] !== undefined))
          .map((dim, i) => {
            const x = padding + 20 + (i % 2) * 150
            const y = height - 20 - Math.floor(i / 2) * 25
            return (
              <g key={dim.label}>
                <line
                  x1={x}
                  y1={y}
                  x2={x + 25}
                  y2={y}
                  stroke={dim.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <circle cx={x + 12.5} cy={y} r={4} fill={dim.color} stroke="white" strokeWidth={2} />
                <text x={x + 35} y={y + 4} fontSize={12} fill="#374151">
                  {dim.label}
                </text>
              </g>
            )
          })
        }
      </svg>
    </div>
  )
}

export default EvaluationTrendChart
