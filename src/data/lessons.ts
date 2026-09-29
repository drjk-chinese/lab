export interface LessonMeta {
  id: string
  title: string
}

export const LESSONS: LessonMeta[] = [
  { id: 'L01', title: '可乐与扣肉' },
  { id: 'L03', title: '我理想的工作' },
]

export const DEFAULT_LESSON_ID = LESSONS[0].id
