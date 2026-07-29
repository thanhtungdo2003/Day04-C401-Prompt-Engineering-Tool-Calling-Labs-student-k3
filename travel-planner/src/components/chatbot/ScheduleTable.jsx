import { motion } from 'framer-motion'
import { CalendarDays, Sunrise, Sun, Moon, Car, Wallet, Lightbulb } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { formatVnd } from '@/lib/utils'

const FIT_COLOR = {
  'dưới ngân sách': 'text-primary',
  'vừa ngân sách': 'text-accent',
  'vượt ngân sách': 'text-red-700',
}

export default function ScheduleTable({ data }) {
  const days = data?.days ?? []

  return (
    <Card>
      <CardTitle
        icon={CalendarDays}
        title="Lịch trình"
        action={
          <span className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
            <span className={`stat-value ${FIT_COLOR[data?.budgetFit] ?? 'text-foreground'}`}>
              {formatVnd(data?.totalCost)}
            </span>
          </span>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="w-16 px-3 py-4 text-lg font-medium">#</th>
              <th className="px-3 py-4">
                <Sunrise className="h-6 w-6" strokeWidth={2} />
              </th>
              <th className="px-3 py-4">
                <Sun className="h-6 w-6" strokeWidth={2} />
              </th>
              <th className="px-3 py-4">
                <Moon className="h-6 w-6" strokeWidth={2} />
              </th>
              <th className="px-3 py-4">
                <Car className="h-6 w-6" strokeWidth={2} />
              </th>
              <th className="px-3 py-4 text-right">
                <Wallet className="ml-auto h-6 w-6" strokeWidth={2} />
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <motion.tr
                key={day.day ?? i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-border/60 align-top"
              >
                <td className="px-3 py-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-xl font-semibold tabular-nums text-primary">
                    {day.day ?? i + 1}
                  </span>
                </td>
                <td className="px-3 py-5 text-base">{day.morning}</td>
                <td className="px-3 py-5 text-base">{day.afternoon}</td>
                <td className="px-3 py-5 text-base">{day.evening}</td>
                <td className="px-3 py-5 text-base text-muted-foreground">{day.transport}</td>
                <td className="px-3 py-5 text-right text-xl font-semibold tabular-nums text-primary">
                  {formatVnd(day.cost)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.advice ? (
        <div className="mt-6 flex items-start gap-4 rounded-lg border border-accent/30 bg-accent/10 p-5">
          <Lightbulb className="h-7 w-7 shrink-0 text-accent" strokeWidth={2} />
          <p className="text-lg leading-relaxed">{data.advice}</p>
        </div>
      ) : null}
    </Card>
  )
}
