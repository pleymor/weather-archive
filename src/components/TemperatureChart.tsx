import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'
import { CHART_COLORS, xAxisProps, axisProps, gridProps, ChartTooltip } from './chartTheme'

export function TemperatureChart({ days, unit = '°C' }: { days: WeatherDay[]; unit?: string }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="temperature-chart" data-points={days.length} className="chart">
      <div className="chart__head">
        <span className="chart__icon" style={{ background: 'rgba(249,115,22,.14)', color: CHART_COLORS.tempMax }}>🌡️</span>
        <h3>Température</h3>
        <span className="chart__unit">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.tempMax} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.tempMax} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.tempMin} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART_COLORS.tempMin} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis {...xAxisProps} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit={unit} />} cursor={{ stroke: 'var(--chart-grid)' }} />
          <Area type="monotone" dataKey="tempMax" name="Max" stroke={CHART_COLORS.tempMax} strokeWidth={2.5} fill="url(#gradMax)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="tempMean" name="Moyenne" stroke={CHART_COLORS.tempMean} strokeWidth={2} fill="none" strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="tempMin" name="Min" stroke={CHART_COLORS.tempMin} strokeWidth={2.5} fill="url(#gradMin)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart__legend">
        <span><i style={{ background: CHART_COLORS.tempMax }} />Max</span>
        <span><i style={{ background: CHART_COLORS.tempMean }} />Moyenne</span>
        <span><i style={{ background: CHART_COLORS.tempMin }} />Min</span>
      </div>
    </div>
  )
}
