import { useCallback, useEffect, useState } from 'react'

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

/** @type {Array<(toasts: Toast[]) => void>} */
const listeners = []

/** @typedef {{ id: string, title?: string, description?: string, variant?: 'default' | 'destructive' }} Toast */

/** @type {Toast[]} */
let memoryState = []

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return String(count)
}

function dispatch() {
  for (const listener of listeners) {
    listener(memoryState)
  }
}

/**
 * @param {Omit<Toast, 'id'> & { id?: string }} props
 */
function toast({ id: providedId, ...props }) {
  const id = providedId ?? genId()

  memoryState = [{ id, ...props }, ...memoryState].slice(0, TOAST_LIMIT)
  dispatch()

  setTimeout(() => {
    memoryState = memoryState.filter((item) => item.id !== id)
    dispatch()
  }, TOAST_REMOVE_DELAY)

  return { id }
}

function dismiss(id) {
  memoryState = memoryState.filter((item) => item.id !== id)
  dispatch()
}

export function useToast() {
  const [toasts, setToasts] = useState(memoryState)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  const dismissToast = useCallback((id) => dismiss(id), [])

  return { toasts, toast, dismiss: dismissToast }
}

export { toast }
