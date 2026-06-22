import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { HourlyPoint } from '../api/hourly'
import { weatherIcon, weatherLabel } from '../lib/weatherIcons'
import { displayTemp, tempUnitLabel, type Units } from '../lib/units'
import { CHART_COLORS, axisProps, gridProps, ChartTooltip } from './chartTheme'

/** Forecast-style hourly view: a temperature curve plus an icon + temperature strip. */
export function HourlyForecast({ hours, units }: { hours: HourlyPoint[]; units: Units }) {
  if (hours.length === 0) return null
  const unit = tempUnitLabel(units.temp)
  const chartData = hours.map((h) => ({ hour: h.hour, temp: displayTemp(h.temp, units.temp) }))

  return (
    <div className="hourly">
      <div className="hourly__chart">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gradHourly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.tempMax} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS.tempMax} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis {...axisProps} dataKey="hour" interval={2} tickFormatter={(h) => `${h}h`} />
            <YAxis {...axisProps} width={40} />
            <Tooltip
              content={(p) => <ChartTooltip {...p} unit={unit} formatLabel={(h) => `${h}h`} />}
              cursor={{ stroke: 'var(--chart-grid)' }}
            />
            <Area type="monotone" dataKey="temp" name="Température" stroke={CHART_COLORS.tempMax}
              strokeWidth={2.5} fill="url(#gradHourly)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="hourly__strip" role="list" aria-label="Prévisions heure par heure">
        {hours.map((h) => {
          const t = displayTemp(h.temp, units.temp)
          const rain = h.precip != null && h.precip >= 0.1
          return (
            <div
              key={h.time}
              role="listitem"
              className="hourly__cell"
              title={`${h.hour}h — ${weatherLabel(h.code)}${t != null ? `, ${t}°` : ''}`}
            >
              <span className="hourly__hour">{h.hour}h</span>
              <span className="hourly__icon" aria-hidden="true">{weatherIcon(h.code, h.isDay)}</span>
              <span className="hourly__temp">{t == null ? '—' : `${Math.round(t)}°`}</span>
              <span className={`hourly__precip${rain ? ' is-wet' : ''}`}>
                {rain ? `${h.precip!.toFixed(1)} mm` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
