import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { WeatherDay } from '../lib/types'

export function PrecipitationChart({ days }: { days: WeatherDay[] }) {
  if (days.length === 0) return <p className="chart-empty">Aucune donnée à afficher.</p>
  return (
    <div data-testid="precipitation-chart" data-points={days.length} className="chart">
      <h3>Précipitations (mm)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="precipitation" name="Précipitations" fill="#4c78a8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
