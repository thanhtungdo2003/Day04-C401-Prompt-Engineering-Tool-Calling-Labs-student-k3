import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Terminal, ChevronDown, Check, X } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ToolUsageBox({ steps }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const finished = steps.filter((s) => s.status === 'done' || s.status === 'error')
  const current = finished.find((s) => s.name === selected) ?? finished[0]

  if (!finished.length) return null

  return (
    <Card className="p-6">
      <CardTitle
        icon={Terminal}
        title="Tool"
        className="mb-0"
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Mở rộng"
            className="flex h-12 w-12 items-center justify-center rounded-lg hover:bg-muted"
          >
            <ChevronDown
              className={cn('h-7 w-7 transition-transform', open && 'rotate-180')}
              strokeWidth={2}
            />
          </button>
        }
      />

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex flex-wrap gap-2">
              {finished.map((step) => (
                <button
                  key={step.name}
                  type="button"
                  onClick={() => setSelected(step.name)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-base font-medium',
                    current?.name === step.name ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  {step.status === 'done' ? (
                    <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  ) : (
                    <X className="h-4 w-4 text-red-700" strokeWidth={2.5} />
                  )}
                  <code>{step.name}</code>
                </button>
              ))}
            </div>

            <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-border bg-muted p-5 text-sm leading-relaxed">
              {JSON.stringify(current?.result ?? current?.error ?? null, null, 2)}
            </pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}
