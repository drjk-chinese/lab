export interface LessonMeta {
  id: string
  title: string
  /** Whether this lesson has a quiz_<id>.json data file (shows the 퀴즈 tab). */
  hasQuiz?: boolean
}

export const LESSONS: LessonMeta[] = [
  { id: 'L01', title: '可乐与扣肉' },
  { id: 'L03', title: '我理想的工作' },
  { id: 'L05', title: '农民工子女的学校', hasQuiz: true },
]

export const DEFAULT_LESSON_ID = LESSONS[0].id
