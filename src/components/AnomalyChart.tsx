import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { xAxisProps, axisProps, gridProps, ChartTooltip } from './chartTheme'

interface AnomalyDatum { date: string; anomaly?: number | null }

const WARM = '#ef4444'
const COOL = '#3b82f6'

export function AnomalyChart({ days, unit = '°C' }: { days: AnomalyDatum[]; unit?: string }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="anomaly-chart" data-points={days.length} className="chart">
      <div className="chart__head">
        <span className="chart__icon" style={{ background: 'rgba(239,68,68,.14)', color: WARM }}>📏</span>
        <h3>Écart à la normale 1991-2020</h3>
        <span className="chart__unit">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis {...xAxisProps} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit={unit} />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }} />
          <ReferenceLine y={0} stroke="var(--chart-axis)" />
          <Bar dataKey="anomaly" name="Écart" radius={[3, 3, 0, 0]}>
            {days.map((d) => (
              <Cell key={d.date} fill={(d.anomaly ?? 0) >= 0 ? WARM : COOL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="chart__legend">
        <span><i style={{ background: WARM }} />Plus chaud que la normale</span>
        <span><i style={{ background: COOL }} />Plus froid</span>
      </div>
    </div>
  )
}
