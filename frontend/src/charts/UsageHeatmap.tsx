import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import type { HeatmapPoint } from '../types/api'
import { EmptyState } from '../components/QueryState'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function UsageHeatmap({ points }: { points: HeatmapPoint[] }) {
  if (!points.length) return <EmptyState>No heatmap data.</EmptyState>
  const maximum = Math.max(...points.map((point) => point.average_flow_rate_lpm), 1)
  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: unknown) => {
        const item = params as { value: [number, number, number] }
        return `${days[item.value[1]]}, ${String(item.value[0]).padStart(2, '0')}:00<br/>${item.value[2].toFixed(2)} L/min average`
      },
    },
    grid: { left: 86, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, index) => index),
      name: 'Hour',
      splitArea: { show: true },
    },
    yAxis: { type: 'category', data: days, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: maximum,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#ecfeff', '#67e8f9', '#0284c7', '#164e63'] },
    },
    series: [
      {
        type: 'heatmap',
        data: points.map((point) => [point.hour, point.day_of_week, point.average_flow_rate_lpm]),
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.25)' } },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 350 }} />
}
