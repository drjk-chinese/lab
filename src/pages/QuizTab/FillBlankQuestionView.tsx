import { useMemo, useState } from 'react'
import type { FillBlankQuestion } from '../../types'
import { shuffle } from '../../lib/quizEngine'

interface Props {
  question: FillBlankQuestion
  onDone: (correct: boolean) => void
}

/** Splits "A{{0}}B{{1}}C" into ["A", 0, "B", 1, "C"] (strings = text, numbers = blank index). */
function splitTemplate(template: string): (string | number)[] {
  const parts: (string | number)[] = []
  const regex = /\{\{(\d+)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(template))) {
    if (match.index > lastIndex) parts.push(template.slice(lastIndex, match.index))
    parts.push(Number(match[1]))
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < template.length) parts.push(template.slice(lastIndex))
  return parts
}

export function FillBlankQuestionView({ question, onDone }: Props) {
  const parts = useMemo(() => splitTemplate(question.template), [question.template])
  const shuffledChoices = useMemo(
    () => question.slots.map((slot) => shuffle(slot.choices)),
    [question.slots],
  )
  const [selected, setSelected] = useState<(string | null)[]>(() => question.slots.map(() => null))
  const [activeSlot, setActiveSlot] = useState<number | null>(0)
  const [graded, setGraded] = useState<boolean[] | null>(null)

  const allFilled = selected.every((s) => s !== null)

  function pick(choice: string) {
    if (graded || activeSlot === null) return
    const next = [...selected]
    next[activeSlot] = choice
    setSelected(next)
    const nextEmpty = next.findIndex((s) => s === null)
    setActiveSlot(nextEmpty === -1 ? null : nextEmpty)
  }

  function grade() {
    const result = question.slots.map((slot, i) => selected[i] === slot.answer)
    setGraded(result)
    onDone(result.every(Boolean))
  }

  return (
    <div className="px-4 pb-24 pt-6">
      <p className="mb-3 text-sm text-text-muted">{question.meaning_kr}</p>

      <div className="border border-line bg-card px-4 py-5 text-lg leading-loose">
        {parts.map((part, i) =>
          typeof part === 'string' ? (
            <span key={i} className="font-hanzi">
              {part}
            </span>
          ) : (
            <button
              key={i}
              onClick={() => !graded && setActiveSlot(part)}
              className={`mx-0.5 inline-block min-w-[2.5rem] border-b-2 px-1 font-hanzi ${
                graded
                  ? graded[part]
                    ? 'border-teal text-teal'
                    : 'border-accent text-accent'
                  : activeSlot === part
                    ? 'border-accent text-accent'
                    : 'border-line text-text-muted'
              }`}
            >
              {selected[part] ?? '＿＿'}
            </button>
          ),
        )}
      </div>

      {graded && (
        <p className="mt-2 text-sm text-text-muted">
          정답:{' '}
          <span className="font-hanzi text-text">
            {question.slots.map((s) => s.answer).join(' / ')}
          </span>
        </p>
      )}

      {!graded && activeSlot !== null && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-text-muted">빈칸 {activeSlot + 1}에 들어갈 글자를 고르세요</p>
          <div className="flex flex-wrap gap-2">
            {shuffledChoices[activeSlot].map((choice) => (
              <button
                key={choice}
                onClick={() => pick(choice)}
                className="border border-line px-4 py-2 font-hanzi text-base"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {graded && (
        <p className="mt-4 border border-line bg-card px-3 py-2 text-sm text-text-muted">
          💡 {question.explanation}
        </p>
      )}

      {!graded && (
        <button
          onClick={grade}
          disabled={!allFilled}
          className="mt-6 w-full bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          채점
        </button>
      )}
    </div>
  )
}
