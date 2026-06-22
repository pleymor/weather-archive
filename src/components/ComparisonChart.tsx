import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { xAxisProps, axisProps, gridProps, ChartTooltip } from './chartTheme'
import type { MergedPoint } from '../lib/compare'

const COLOR_A = '#6366f1'
const COLOR_B = '#f97316'

export function ComparisonChart({
  data, labelA, labelB, unit = '°C',
}: { data: MergedPoint[]; labelA: string; labelB: string; unit?: string }) {
  if (data.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="comparison-chart" data-points={data.length} className="chart">
      <div className="chart__head">
        <span className="chart__icon" style={{ background: 'rgba(99,102,241,.14)', color: COLOR_A }}>⚖️</span>
        <h3>Température moyenne — comparaison</h3>
        <span className="chart__unit">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis {...xAxisProps} />
          <YAxis {...axisProps} width={44} />
          <Tooltip content={(p) => <ChartTooltip {...p} unit={unit} />} cursor={{ stroke: 'var(--chart-grid)' }} />
          <Line type="monotone" dataKey="a" name={labelA} stroke={COLOR_A} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="b" name={labelB} stroke={COLOR_B} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart__legend">
        <span><i style={{ background: COLOR_A }} />{labelA}</span>
        <span><i style={{ background: COLOR_B }} />{labelB}</span>
      </div>
    </div>
  )
}
