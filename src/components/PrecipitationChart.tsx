import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import type { WeatherDay } from '../lib/types'
import { CHART_COLORS, xAxisProps, axisProps, gridProps, ChartTooltip } from './chartTheme'

export function PrecipitationChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="precipitation-chart" data-points={days.length} className="chart">
      <div className="chart__head">
        <span className="chart__icon" style={{ background: 'rgba(56,189,248,.14)', color: CHART_COLORS.precip }}>🌧️</span>
        <h3>Précipitations</h3>
        <span className="chart__unit">mm</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPrecip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.95} />
              <stop offset="100%" stopColor={CHART_COLORS.precip} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis {...xAxisProps} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit="mm" />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }} />
          <Bar dataKey="precipitation" name="Précipitations" fill="url(#gradPrecip)" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {days.map((d) => (
              <Cell key={d.date} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
