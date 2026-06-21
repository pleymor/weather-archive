import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function TemperatureChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="temperature-chart" data-points={days.length} className="chart">
      <h3>Température (°C)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="tempMax" name="Max" stroke="#e45756" dot={false} />
          <Line type="monotone" dataKey="tempMean" name="Moyenne" stroke="#4c78a8" dot={false} />
          <Line type="monotone" dataKey="tempMin" name="Min" stroke="#54a24b" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
