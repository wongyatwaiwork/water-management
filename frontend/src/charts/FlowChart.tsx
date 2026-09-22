import type { EChartsOption, LineSeriesOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import type { Anomaly, UsagePoint } from '../types/api'
import { EmptyState } from '../components/QueryState'

export function FlowChart({ points, anomalies }: { points: UsagePoint[]; anomalies: Anomaly[] }) {
  if (!points.length) return <EmptyState>No flow readings in this time range.</EmptyState>
  const intervals: NonNullable<LineSeriesOption['markArea']>['data'] = anomalies
    .filter((item) => item.end_time)
    .map((item) => [
      {
        name: item.anomaly_type.replaceAll('_', ' '),
        xAxis: item.start_time,
        itemStyle: {
          color: item.severity === 'HIGH' ? 'rgba(220,38,38,.18)' : 'rgba(245,158,11,.16)',
        },
      },
      { xAxis: item.end_time! },
    ])
  const option: EChartsOption = {
    grid: { left: 52, right: 22, top: 34, bottom: 68 },
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${Number(value).toFixed(2)} L/min` },
    xAxis: { type: 'time', axisLabel: { hideOverlap: true } },
    yAxis: { type: 'value', name: 'L/min', nameGap: 14, min: 0 },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 16 }],
    series: [
      {
        name: 'Average flow',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: points.map((point) => [point.timestamp, point.average_flow_rate_lpm]),
        lineStyle: { color: '#0284c7', width: 2.5 },
        areaStyle: { color: 'rgba(14,165,233,.11)' },
        markArea: { silent: false, label: { fontSize: 10 }, data: intervals },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 390 }} notMerge lazyUpdate />
}
