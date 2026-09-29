import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_LESSON_ID, LESSONS } from '../data/lessons'

const STORAGE_KEY = 'current_lesson_id'

interface LessonContextValue {
  lessonId: string
  setLessonId: (id: string) => void
}

const LessonContext = createContext<LessonContextValue | null>(null)

export function LessonProvider({ children }: { children: ReactNode }) {
  const [lessonId, setLessonIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored && LESSONS.some((l) => l.id === stored) ? stored : DEFAULT_LESSON_ID
    } catch {
      return DEFAULT_LESSON_ID
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lessonId)
    } catch {
      // ignore
    }
  }, [lessonId])

  function setLessonId(id: string) {
    setLessonIdState(id)
  }

  return <LessonContext.Provider value={{ lessonId, setLessonId }}>{children}</LessonContext.Provider>
}

export function useLesson() {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within LessonProvider')
  return ctx
}
