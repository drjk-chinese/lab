import { useCallback, useState } from 'react'

/**
 * Like useSessionState but backed by localStorage, for state that should
 * survive across sessions (e.g. which sentences a student starred for the
 * quiz tab), as opposed to session-scoped state like checked words.
 */
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
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
          localStorage.setItem(key, JSON.stringify(resolved))
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
