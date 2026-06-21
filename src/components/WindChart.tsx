import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function WindChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="wind-chart" data-points={days.length} className="chart">
      <h3>Vent max (km/h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="windMax" name="Vent max" stroke="#f58518" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
