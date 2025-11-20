"use client"

type ForecastPeriod = {
  name: string
  startTime: string
  endTime: string
  isDaytime: boolean
  temperature: number
  temperatureUnit: string
  shortForecast: string
}

type DayForecast = {
  dayName: string
  date: Date
  high: number | null
  low: number | null
  icon: string
  unit: string
}

function getWeatherIcon(forecast: string): string {
  const lower = forecast.toLowerCase()
  if (lower.includes('sunny') || lower.includes('clear')) return '☀️'
  if (lower.includes('cloudy') && !lower.includes('partly')) return '☁️'
  if (lower.includes('partly cloudy') || lower.includes('mostly sunny')) return '⛅'
  if (lower.includes('mostly cloudy')) return '🌤️'
  if (lower.includes('rain') || lower.includes('shower')) return '🌧️'
  if (lower.includes('thunderstorm') || lower.includes('thunder')) return '⛈️'
  if (lower.includes('snow')) return '❄️'
  if (lower.includes('fog') || lower.includes('mist')) return '🌫️'
  return '🌤️'
}

function groupForecastByDay(periods: ForecastPeriod[]): DayForecast[] {
  const daysMap = new Map<string, DayForecast>()

  periods.forEach((period) => {
    const date = new Date(period.startTime)
    const dateKey = date.toDateString()
    
    if (!daysMap.has(dateKey)) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      daysMap.set(dateKey, {
        dayName: dayNames[date.getDay()],
        date,
        high: null,
        low: null,
        icon: getWeatherIcon(period.shortForecast),
        unit: period.temperatureUnit,
      })
    }

    const day = daysMap.get(dateKey)!
    if (period.isDaytime) {
      if (day.high === null || period.temperature > day.high) {
        day.high = period.temperature
        day.icon = getWeatherIcon(period.shortForecast) // Use daytime icon
      }
    } else {
      if (day.low === null || period.temperature < day.low) {
        day.low = period.temperature
      }
    }
  })

  // Sort by date and take first 7 days
  return Array.from(daysMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 7)
}

export default function SevenDayForecast({ periods }: { periods: ForecastPeriod[] }) {
  const dayForecasts = groupForecastByDay(periods)

  if (dayForecasts.length === 0) {
    return <div className="text-sm text-gray-600">No forecast data available</div>
  }

  return (
    <div className="w-full">
      <div className="text-base font-semibold text-gray-900 mb-4">7-Day Forecast</div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {dayForecasts.map((day, idx) => (
          <div
            key={idx}
            className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center transition-all hover:bg-gray-100 hover:-translate-y-0.5"
          >
            <div className="text-xs font-semibold text-gray-600 mb-1 sm:mb-2">{day.dayName}</div>
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{day.icon}</div>
            <div className="text-xs">
              {day.high !== null && (
                <div className="font-semibold text-gray-900">{day.high}°</div>
              )}
              {day.low !== null && (
                <div className="text-gray-600">{day.low}°</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

