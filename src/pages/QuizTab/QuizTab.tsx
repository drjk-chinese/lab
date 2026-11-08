import { useEffect, useState } from 'react'
import { getQuiz } from '../../lib/dataSource'
import { logEvent } from '../../lib/logging'
import { useAuth } from '../../contexts/AuthContext'
import { useLesson } from '../../contexts/LessonContext'
import { useLocalStorageState } from '../../hooks/useLocalStorageState'
import { LESSONS } from '../../data/lessons'
import { drawQuizSet, buildRetrySet, shuffle, type QuizMode } from '../../lib/quizEngine'
import { FillBlankQuestionView } from './FillBlankQuestionView'
import { WordOrderQuestionView } from './WordOrderQuestionView'
import { ResultsScreen } from './ResultsScreen'
import type { QuizData, FillBlankQuestion, WordOrderQuestion } from '../../types'

type Stage = 'setup' | 'quiz' | 'results'
type AnyQ = FillBlankQuestion | WordOrderQuestion

export function QuizTab() {
  const { user } = useAuth()
  const { lessonId: LESSON_ID } = useLesson()
  const [data, setData] = useState<QuizData | null>(null)
  const [stage, setStage] = useState<Stage>('setup')
  const [mode, setMode] = useState<QuizMode>('random')
  const [queue, setQueue] = useState<AnyQ[]>([])
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [askedIds, setAskedIds] = useState<Set<string>>(new Set())
  const [bookmarked] = useLocalStorageState<string[]>(`quiz_bookmarks_${LESSON_ID}`, [])

  useEffect(() => {
    getQuiz(LESSON_ID).then(setData)
    setStage('setup')
  }, [LESSON_ID])

  const lessonTitle = LESSONS.find((l) => l.id === LESSON_ID)?.title ?? LESSON_ID

  const lessonHasQuiz = LESSONS.find((l) => l.id === LESSON_ID)?.hasQuiz ?? false

  if (!lessonHasQuiz) {
    return <div className="p-6 text-sm text-text-muted">이 과에는 아직 퀴즈가 없습니다.</div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>
  }
  const quizData = data

  function runSet(fillBlank: FillBlankQuestion[], wordOrder: WordOrderQuestion[]) {
    const combined = shuffle<AnyQ>([...fillBlank, ...wordOrder])
    setQueue(combined)
    setIndex(0)
    setAnswered(false)
    setResults({})
    setAskedIds((prev) => new Set([...prev, ...combined.map((q) => q.question_id)]))
    setStage('quiz')
  }

  function startQuiz() {
    const set = drawQuizSet(quizData, mode, new Set(bookmarked))
    setAskedIds(new Set())
    runSet(set.fillBlank, set.wordOrder)
  }

  function handleDone(q: AnyQ, correct: boolean) {
    setResults((r) => ({ ...r, [q.question_id]: correct }))
    logEvent(
      user?.studentId ?? null,
      LESSON_ID,
      'quiz_answer',
      `${q.question_id}:${q.type}:${correct ? 'correct' : 'incorrect'}`,
    )
    setAnswered(true)
  }

  function next() {
    if (index < queue.length - 1) {
      setIndex((i) => i + 1)
      setAnswered(false)
    } else {
      setStage('results')
    }
  }

  function retryWrongVariants() {
    const wrong = queue.filter((q) => results[q.question_id] === false)
    const wrongFB = wrong.filter((q): q is FillBlankQuestion => q.type === 'fill_blank')
    const wrongWO = wrong.filter((q): q is WordOrderQuestion => q.type === 'word_order')
    const retrySet = buildRetrySet(wrongFB, wrongWO, quizData, askedIds)
    runSet(retrySet.fillBlank, retrySet.wordOrder)
  }

  function retryFresh() {
    const set = drawQuizSet(quizData, mode, new Set(bookmarked))
    runSet(set.fillBlank, set.wordOrder)
  }

  if (stage === 'setup') {
    return (
      <div className="px-4 py-8">
        <h2 className="text-lg font-semibold">{lessonTitle} 문법·어휘 퀴즈</h2>
        <p className="mt-2 text-sm text-text-muted">
          빈칸 채우기 {Math.min(8, data.fill_blank.length)}문제 + 단어 배열{' '}
          {Math.min(4, data.word_order.length)}문제, 총{' '}
          {Math.min(8, data.fill_blank.length) + Math.min(4, data.word_order.length)}문제가
          출제됩니다.
        </p>

        <div className="mt-6 space-y-2">
          <label className="flex items-start gap-2 border border-line px-3 py-2">
            <input
              type="radio"
              name="mode"
              className="mt-1"
              checked={mode === 'random'}
              onChange={() => setMode('random')}
            />
            <span>
              <span className="block text-sm font-medium">랜덤 출제</span>
              <span className="block text-xs text-text-muted">전체 범위에서 무작위로 출제됩니다.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 border border-line px-3 py-2">
            <input
              type="radio"
              name="mode"
              className="mt-1"
              checked={mode === 'random_plus_selected'}
              onChange={() => setMode('random_plus_selected')}
            />
            <span>
              <span className="block text-sm font-medium">랜덤 + 낭독탭 선택 문장 포함</span>
              <span className="block text-xs text-text-muted">
                낭독 탭에서 ⭐ 표시한 문장 {bookmarked.length}개를 먼저 포함하고, 나머지는
                랜덤으로 채웁니다.
              </span>
            </span>
          </label>
        </div>

        <button
          onClick={startQuiz}
          className="mt-6 w-full bg-accent py-3 text-sm font-medium text-white"
        >
          퀴즈 시작
        </button>
      </div>
    )
  }

  if (stage === 'quiz') {
    const q = queue[index]
    return (
      <div className="pb-24">
        <p className="px-4 pt-4 text-xs text-text-muted">
          {q.type === 'fill_blank' ? '빈칸 채우기' : '단어 배열'} · {index + 1} / {queue.length}
        </p>
        {q.type === 'fill_blank' ? (
          <FillBlankQuestionView
            key={q.question_id}
            question={q}
            onDone={(correct) => handleDone(q, correct)}
          />
        ) : (
          <WordOrderQuestionView
            key={q.question_id}
            question={q}
            onDone={(correct) => handleDone(q, correct)}
          />
        )}
        {answered && (
          <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-line bg-bg-app px-4 py-3">
            <button onClick={next} className="w-full bg-accent py-3 text-sm font-medium text-white">
              {index < queue.length - 1 ? '다음 문제' : '결과 보기'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const correctCount = queue.filter((q) => results[q.question_id]).length
  const wrongCount = queue.filter((q) => results[q.question_id] === false).length

  return (
    <ResultsScreen
      studentId={user?.studentId ?? null}
      studentName={user?.name ?? null}
      lessonTitle={lessonTitle}
      correctCount={correctCount}
      totalCount={queue.length}
      wrongCount={wrongCount}
      canRetryWrong={wrongCount > 0}
      onRetryWrong={retryWrongVariants}
      onRetryFresh={retryFresh}
    />
  )
}
