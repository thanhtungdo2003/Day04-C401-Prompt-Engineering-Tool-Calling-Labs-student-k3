import { motion } from 'framer-motion'
import { Route, Car, Ticket, Backpack, Ruler, Clock } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import MapModal from '@/components/chatbot/MapModal'
import { formatVnd } from '@/lib/utils'

export default function TripPlanCard({ data }) {
  return (
    <Card>
      <CardTitle
        icon={Route}
        title={`${data.from?.name ?? ''} → ${data.to?.name ?? ''}`}
        action={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-lg font-semibold tabular-nums">
              <Ruler className="h-5 w-5 text-primary" strokeWidth={2} />
              {data.distanceKm} km
            </span>
            <MapModal origin={data.from?.name} destination={data.to?.name} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Section icon={Car}>
          {(data.vehicles ?? []).map((v, i) => (
            <Row key={v.name} delay={i * 0.05} title={v.name} sub={v.reason}>
              <span className="text-xl font-semibold tabular-nums text-primary">
                {formatVnd(v.estimatedCost)}
              </span>
              {v.durationHours ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                  {v.durationHours}h
                </span>
              ) : null}
            </Row>
          ))}
        </Section>

        <Section icon={Ticket}>
          {(data.trips ?? []).map((t, i) => (
            <Row
              key={`${t.operator}-${i}`}
              delay={i * 0.05}
              title={t.operator}
              sub={`${t.departTime ?? ''} → ${t.arriveTime ?? ''}`}
            >
              <span className="text-xl font-semibold tabular-nums text-primary">
                {formatVnd(t.price)}
              </span>
            </Row>
          ))}
        </Section>

        <Section icon={Backpack}>
          {(data.packing ?? []).map((p, i) => (
            <Row key={p.item} delay={i * 0.04} title={p.item} sub={p.reason} />
          ))}
        </Section>
      </div>
    </Card>
  )
}

function Section({ icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <Icon className="h-7 w-7 text-accent" strokeWidth={2} />
      {children}
    </div>
  )
}

function Row({ delay, title, sub, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-border bg-muted p-4"
    >
      <p className="text-lg font-semibold leading-tight">{title}</p>
      {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
      {children ? <div className="mt-2 flex items-center gap-3">{children}</div> : null}
    </motion.div>
  )
}
