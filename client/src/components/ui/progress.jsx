import { cn } from '@/lib/utils'

/**
 * @param {{
 *   value: number,
 *   className?: string,
 *   indicatorClassName?: string,
 *   indicatorStyle?: import('react').CSSProperties,
 * }} props
 */
export function Progress({ value, className, indicatorClassName, indicatorStyle }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-white/10', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width,background] duration-300 ease-linear',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%`, ...indicatorStyle }}
      />
    </div>
  )
}
