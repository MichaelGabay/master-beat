import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'flex h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white placeholder:text-zinc-500 outline-none transition-colors focus-visible:border-purple-500/50 focus-visible:ring-2 focus-visible:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

export { Input }
