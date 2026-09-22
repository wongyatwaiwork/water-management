import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import type { DailyPoint } from '../types/api'
import { EmptyState } from '../components/QueryState'

export function DailyConsumptionChart({ points }: { points: DailyPoint[] }) {
  if (!points.length) return <EmptyState>No daily consumption data.</EmptyState>
  const option: EChartsOption = {
    grid: { left: 60, right: 18, top: 24, bottom: 42 },
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${Number(value).toFixed(1)} L` },
    xAxis: {
      type: 'category',
      data: points.map((point) =>
        new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ),
      axisLabel: { rotate: points.length > 10 ? 40 : 0 },
    },
    yAxis: { type: 'value', name: 'Liters' },
    series: [
      {
        type: 'bar',
        data: points.map((point) => point.volume_liters),
        itemStyle: { color: '#0d9488', borderRadius: [5, 5, 0, 0] },
        barMaxWidth: 34,
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 320 }} />
}
