import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, X, Wand2, History, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatVnd } from '@/lib/utils'

const PRICE_VND = 49_000

// Tinh nang "goi y lai dua tren ket qua cu" chua duoc xay dung.
// Man hinh nay la placeholder cho ban tra phi, khong thu thap thong tin thanh toan.
const PERKS = [
  { icon: Wand2, label: 'Chỉnh yêu cầu, giữ nguyên lịch cũ' },
  { icon: History, label: 'So sánh phiên bản trước và sau' },
  { icon: Clock, label: 'Không phải chạy lại từ đầu' },
]

export default function PaywallModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Tính năng gợi ý lại"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="surface w-full max-w-md p-8 shadow-2xl"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-5 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Lock className="h-10 w-10" strokeWidth={2} />
              </span>
              <h2 className="text-3xl font-bold tracking-tight">Gợi ý lại</h2>
              <p className="stat-value text-primary">{formatVnd(PRICE_VND)}</p>
            </div>

            <ul className="mt-8 space-y-4">
              {PERKS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-4">
                  <Icon className="h-6 w-6 shrink-0 text-accent" strokeWidth={2} />
                  <span className="text-lg">{label}</span>
                </li>
              ))}
            </ul>

            <Button variant="outline" className="mt-8 w-full" onClick={onClose}>
              Đóng
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Tính năng đang phát triển, chưa mở bán.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
