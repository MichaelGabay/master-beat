import { cn } from '@/lib/utils'

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 text-card-foreground backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-5 pb-0', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-base font-semibold leading-none text-white', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-zinc-400', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-5', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
