import { useMemo, useState } from 'react'
import type { WordOrderQuestion } from '../../types'
import { shuffle } from '../../lib/quizEngine'

interface Props {
  question: WordOrderQuestion
  onDone: (correct: boolean) => void
}

/** Tags each token with a stable instance id so duplicate words (e.g. two 的) are distinguishable. */
function makeTiles(tokens: string[]) {
  return tokens.map((text, i) => ({ id: `${i}-${text}`, text }))
}

export function WordOrderQuestionView({ question, onDone }: Props) {
  const tiles = useMemo(() => makeTiles(question.tokens), [question.tokens])
  const [pool, setPool] = useState(() => shuffle(tiles))
  const [placed, setPlaced] = useState<typeof tiles>([])
  const [graded, setGraded] = useState<boolean | null>(null)

  function place(tile: (typeof tiles)[number]) {
    if (graded !== null) return
    setPlaced((p) => [...p, tile])
    setPool((p) => p.filter((t) => t.id !== tile.id))
  }

  function unplace(tile: (typeof tiles)[number]) {
    if (graded !== null) return
    setPool((p) => [...p, tile])
    setPlaced((p) => p.filter((t) => t.id !== tile.id))
  }

  function reset() {
    if (graded !== null) return
    setPool(shuffle(tiles))
    setPlaced([])
  }

  function grade() {
    const correct =
      placed.length === question.tokens.length &&
      placed.every((t, i) => t.text === question.tokens[i])
    setGraded(correct)
    onDone(correct)
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <p className="mb-3 text-sm text-text-muted">{question.meaning_kr}</p>

      <div className="min-h-[4rem] border border-line bg-card px-3 py-3">
        {placed.length === 0 && <span className="text-sm text-text-muted">아래 단어를 탭해서 순서대로 배치하세요</span>}
        <div className="flex flex-wrap gap-2">
          {placed.map((t) => (
            <button
              key={t.id}
              onClick={() => unplace(t)}
              disabled={graded !== null}
              className={`border px-3 py-1.5 font-hanzi text-base ${
                graded === null ? 'border-accent bg-accent-soft text-accent' : 'border-line'
              }`}
            >
              {t.text}
            </button>
          ))}
        </div>
      </div>

      {graded !== null && (
        <p className={`mt-2 text-sm ${graded ? 'text-teal' : 'text-accent'}`}>
          {graded ? '정답이에요!' : '오답이에요.'} 정답:{' '}
          <span className="font-hanzi text-text">{question.tokens.join('')}</span>
        </p>
      )}

      {graded === null && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pool.map((t) => (
            <button
              key={t.id}
              onClick={() => place(t)}
              className="border border-line px-3 py-1.5 font-hanzi text-base"
            >
              {t.text}
            </button>
          ))}
        </div>
      )}

      {graded === null && (
        <div className="mt-4 flex gap-2">
          <button onClick={reset} className="border border-line px-3 py-1.5 text-xs text-text-muted">
            초기화
          </button>
          <button
            onClick={grade}
            disabled={pool.length > 0}
            className="flex-1 bg-accent py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            채점
          </button>
        </div>
      )}

      {graded !== null && (
        <p className="mt-4 border border-line bg-card px-3 py-2 text-sm text-text-muted">
          💡 {question.explanation}
        </p>
      )}
    </div>
  )
}
