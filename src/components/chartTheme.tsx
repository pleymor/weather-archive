import type { ReactNode } from 'react'
import { formatShortDate, formatLongDate } from '../lib/dates'

/** Shared visual language for all charts. */
export const CHART_COLORS = {
  tempMax: '#f97316', // orange-500
  tempMean: '#6366f1', // indigo-500
  tempMin: '#0ea5e9', // sky-500
  precip: '#38bdf8', // sky-400
  wind: '#14b8a6', // teal-500
}

export const axisProps = {
  stroke: 'var(--chart-axis)',
  tick: { fill: 'var(--text-dim)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
}

export const xAxisProps = {
  ...axisProps,
  dataKey: 'date',
  tickFormatter: formatShortDate,
  minTickGap: 28,
}

export const gridProps = {
  stroke: 'var(--chart-grid)',
  strokeDasharray: '0',
  vertical: false,
}

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
}

/**
 * A glassy custom tooltip shared across charts. Recharts passes loosely-typed
 * props to `content`, so we accept them untyped and narrow to the fields we use.
 */
export function ChartTooltip(props: {
  active?: boolean
  payload?: readonly unknown[]
  label?: unknown
  unit: string
}): ReactNode {
  const { active, label, unit } = props
  const payload = (props.payload ?? []) as TooltipEntry[]
  if (!active || payload.length === 0) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__date">{label != null ? formatLongDate(String(label)) : ''}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: entry.color }} />
          <span className="chart-tooltip__name">{entry.name}</span>
          <span className="chart-tooltip__value">
            {entry.value == null ? '—' : `${entry.value} ${unit}`}
          </span>
        </p>
      ))}
    </div>
  )
}
