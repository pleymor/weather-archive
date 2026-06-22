import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { axisProps, gridProps, ChartTooltip } from './chartTheme'

export interface ThisDayDatum { year: number; value: number | null; trend: number | null }

const WARM = '#f97316'
const COOL = '#0ea5e9'

export function ThisDayChart({ data, unit = '°C', mid }: { data: ThisDayDatum[]; unit?: string; mid: number }) {
  if (data.length === 0) return <p className="chart-empty">Aucune donnée pour ce jour.</p>
  return (
    <div data-testid="thisday-chart" data-points={data.length} className="chart">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis {...axisProps} dataKey="year" minTickGap={24} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit={unit} />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }} />
          <Bar dataKey="value" name="Température" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.year} fill={(d.value ?? mid) >= mid ? WARM : COOL} />
            ))}
          </Bar>
          <Line dataKey="trend" name="Tendance" stroke="var(--text)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="chart__legend">
        <span><i style={{ background: WARM }} />Au-dessus de la moyenne</span>
        <span><i style={{ background: COOL }} />En dessous</span>
        <span><i style={{ background: 'var(--text)' }} />Tendance</span>
      </div>
    </div>
  )
}
