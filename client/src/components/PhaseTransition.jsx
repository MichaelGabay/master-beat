import { AnimatePresence, motion } from 'framer-motion'

/**
 * @param {{ phaseKey: string, children: import('react').ReactNode, className?: string }} props
 */
export function PhaseTransition({ phaseKey, children, className }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
