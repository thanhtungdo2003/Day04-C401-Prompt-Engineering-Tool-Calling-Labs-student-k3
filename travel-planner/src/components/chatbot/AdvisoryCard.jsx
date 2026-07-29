import { motion } from 'framer-motion'
import { ShieldAlert, TriangleAlert, Lightbulb, PencilLine } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STYLE = {
  block: {
    icon: ShieldAlert,
    title: 'Nên đổi mục tiêu',
    tone: 'border-red-500/40 bg-red-500/5',
    mark: 'text-red-700',
  },
  warn: {
    icon: TriangleAlert,
    title: 'Cân nhắc trước khi đi',
    tone: 'border-primary/40 bg-primary/5',
    mark: 'text-primary',
  },
}

export default function AdvisoryCard({ data, onEdit }) {
  const style = STYLE[data.verdict]
  if (!style) return null

  return (
    <Card className={cn(style.tone)}>
      <CardTitle
        icon={style.icon}
        title={style.title}
        action={
          data.verdict === 'block' && onEdit ? (
            <Button variant="outline" onClick={onEdit}>
              <PencilLine className="h-6 w-6" strokeWidth={2} />
              Sửa
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {data.issues.map((issue, i) => (
            <motion.div
              key={issue.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
            >
              <style.icon className={cn('h-6 w-6 shrink-0', style.mark)} strokeWidth={2} />
              <div>
                <p className="text-lg font-semibold leading-tight">{issue.title}</p>
                <p className="mt-1 text-base text-muted-foreground">{issue.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          {data.suggestions.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
            >
              <Lightbulb className="h-6 w-6 shrink-0 text-accent" strokeWidth={2} />
              <div>
                <p className="text-lg font-semibold leading-tight">{tip.title}</p>
                <p className="mt-1 text-base text-muted-foreground">{tip.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  )
}
