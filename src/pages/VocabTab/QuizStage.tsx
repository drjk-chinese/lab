import { useMemo, useState } from 'react'
import type { VocabWord } from '../../types'
import { buildQuizQuestions, type QuizQuestion } from '../../lib/quiz'
import { logEvent } from '../../lib/logging'

interface Props {
  words: VocabWord[]
  pool: VocabWord[]
  studentId: string | null
  lessonId: string
  title: string
  onFinish: (wrongWords: VocabWord[]) => void
}

const QUESTION_LABEL: Record<QuizQuestion['type'], string> = {
  meaning: '뜻은?',
  pinyin: '병음은?',
}

export function QuizStage({ words, pool, studentId, lessonId, title, onFinish }: Props) {
  const questions = useMemo(() => buildQuizQuestions(words, pool), [words, pool])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set())

  const q = questions[index]

  function choose(choiceIndex: number) {
    if (selected !== null) return
    setSelected(choiceIndex)
    const correct = choiceIndex === q.correctIndex
    logEvent(
      studentId,
      lessonId,
      'quiz_answer',
      `${q.word.word_id}:${q.type}:${correct ? 'correct' : 'incorrect'}`,
    )
    if (!correct) {
      setWrongIds((prev) => new Set(prev).add(q.word.word_id))
    }
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
    } else {
      const wrongWords = words.filter((w) => wrongIds.has(w.word_id))
      onFinish(wrongWords)
    }
  }

  if (!q) return null

  return (
    <div className="flex flex-col items-center px-4 pb-24 pt-8">
      <p className="mb-4 text-sm text-text-muted">
        {title} · {index + 1} / {questions.length}
      </p>

      <div className="w-full max-w-sm border border-line bg-card px-6 py-8 text-center">
        <p className="font-hanzi text-3xl font-semibold">{q.word.hanzi}</p>
        <p className="mt-2 text-sm text-text-muted">{QUESTION_LABEL[q.type]}</p>
      </div>

      <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
        {q.choices.map((choice, i) => {
          const isCorrect = i === q.correctIndex
          const isSelected = i === selected
          let style = 'border-line'
          if (selected !== null) {
            if (isCorrect) style = 'border-teal bg-teal-soft'
            else if (isSelected) style = 'border-accent bg-accent-soft'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`border px-4 py-3 text-left text-sm ${style}`}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <button onClick={next} className="mt-6 w-full max-w-sm bg-accent py-3 text-sm text-white">
          {index < questions.length - 1 ? '다음 문제' : '결과 보기'}
        </button>
      )}
    </div>
  )
}
