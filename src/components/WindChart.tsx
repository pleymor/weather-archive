import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'
import { CHART_COLORS, xAxisProps, axisProps, gridProps, ChartTooltip } from './chartTheme'

export function WindChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="wind-chart" data-points={days.length} className="chart">
      <div className="chart__head">
        <span className="chart__icon" style={{ background: 'rgba(20,184,166,.14)', color: CHART_COLORS.wind }}>💨</span>
        <h3>Vent max</h3>
        <span className="chart__unit">km/h</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.wind} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.wind} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis {...xAxisProps} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit="km/h" />} cursor={{ stroke: 'var(--chart-grid)' }} />
          <Area type="monotone" dataKey="windMax" name="Vent max" stroke={CHART_COLORS.wind} strokeWidth={2.5} fill="url(#gradWind)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
