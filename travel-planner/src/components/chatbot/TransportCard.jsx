import { useState } from 'react'
import { motion } from 'framer-motion'
import { CarTaxiFront, Bike, Car, Bus, Users, Ruler } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { calculateTransportCost } from '@/lib/travelApi'
import { formatVnd } from '@/lib/utils'

const VEHICLE_ICONS = { bike: Bike, car4: Car, car7: Users, bus: Bus }

export default function TransportCard({ data }) {
  const [distance, setDistance] = useState(5)

  return (
    <Card>
      <CardTitle
        icon={CarTaxiFront}
        title="Giá xe"
        action={
          <span className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-lg font-semibold tabular-nums">
            <Ruler className="h-5 w-5 text-primary" strokeWidth={2} />
            {distance} km
          </span>
        }
      />

      <Slider
        min={1}
        max={50}
        step={1}
        value={distance}
        onChange={(e) => setDistance(Number(e.target.value))}
        aria-label="Quãng đường"
        className="mb-6"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((rule, i) => {
          const Icon = VEHICLE_ICONS[rule.vehicle] ?? Car
          const { cost } = calculateTransportCost(distance, rule.id)
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border border-border bg-muted p-5"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-7 w-7 text-accent" strokeWidth={2} />
                <p className="text-base font-medium text-muted-foreground">{rule.brand}</p>
              </div>
              <p className="mt-3 stat-value text-primary">{formatVnd(cost)}</p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {rule.flat ? formatVnd(rule.base) : `${formatVnd(rule.base)} + ${formatVnd(rule.perKm)}/km`}
              </p>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
