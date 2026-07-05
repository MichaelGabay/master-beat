import { X } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300',
            item.variant === 'destructive'
              ? 'border-red-500/30 bg-[#1a0f2e]/95 text-white'
              : 'border-white/10 bg-[#1a0f2e]/95 text-white',
          )}
          role="status"
        >
          <div className="min-w-0 flex-1">
            {item.title && <p className="text-sm font-semibold">{item.title}</p>}
            {item.description && (
              <p className={cn('text-sm text-zinc-400', item.title && 'mt-0.5')}>
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="shrink-0 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-white"
            aria-label="סגור הודעה"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
