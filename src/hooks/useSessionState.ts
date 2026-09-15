import { useCallback, useState } from 'react'

/**
 * Session-scoped state backed by sessionStorage. Used for checked
 * (starred) words and quiz progress, which the spec says are scoped to
 * the current session/passage, not accumulated across the semester.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        try {
          sessionStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // ignore quota / private-mode errors
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update] as const
}
