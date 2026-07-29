import { motion } from 'framer-motion'
import {
  CloudSun,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import MapModal from '@/components/chatbot/MapModal'
import { formatDay } from '@/lib/utils'

const ICONS = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

export default function WeatherCard({ data }) {
  return (
    <Card>
      <CardTitle
        icon={CloudSun}
        title={data.place.name}
        action={
          <MapModal
            query={[data.place.name, data.place.admin, data.place.country]
              .filter(Boolean)
              .join(', ')}
            title={data.place.name}
          />
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {data.days.map((day, i) => {
          const Icon = ICONS[day.icon] ?? Cloud
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-muted p-4 text-center"
              title={day.label}
            >
              <p className="text-sm text-muted-foreground">{formatDay(day.date)}</p>
              <Icon className="mx-auto my-3 h-9 w-9 text-accent" strokeWidth={1.75} />
              <p className="text-2xl font-semibold tabular-nums">{day.tempMax}°</p>
              <p className="text-base text-muted-foreground tabular-nums">{day.tempMin}°</p>
              {day.humidity != null ? (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                  <Droplets className="h-4 w-4" strokeWidth={2} />
                  {day.humidity}%
                </p>
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
