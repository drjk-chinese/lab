import { useEffect, useRef, useState } from 'react'
import type { VocabWord } from '../../types'
import { speak } from '../../lib/tts'
import { logEvent } from '../../lib/logging'

interface Props {
  words: VocabWord[]
  studentId: string | null
  lessonId: string
  title: string
  onDone: () => void
}

export function FlashcardStage({ words, studentId, lessonId, title, onDone }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const word = words[index]

  useEffect(() => {
    if (word) logEvent(studentId, lessonId, 'flashcard_view', word.word_id)
    setFlipped(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function next() {
    if (index < words.length - 1) setIndex((i) => i + 1)
    else onDone()
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -50) next()
    else if (delta > 50) prev()
    touchStartX.current = null
  }

  if (!word) return null

  return (
    <div className="flex flex-col items-center px-4 pb-24 pt-8">
      <p className="mb-4 text-sm text-text-muted">
        {title} · {index + 1} / {words.length}
      </p>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setFlipped((f) => !f)}
        className="flex h-64 w-full max-w-sm cursor-pointer flex-col items-center justify-center border border-line bg-card px-6 text-center"
      >
        {!flipped ? (
          <>
            <p className="font-hanzi text-4xl font-semibold">{word.hanzi}</p>
            <p className="mt-2 text-sm text-text-muted">탭하여 뜻 보기</p>
          </>
        ) : (
          <>
            <p className="text-sm text-teal">{word.pinyin}</p>
            <p className="mt-2 text-xl">{word.meaning_kr}</p>
          </>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          speak(word.hanzi)
        }}
        className="mt-4 border border-teal px-4 py-2 text-sm text-teal"
      >
        🔊 발음 듣기
      </button>

      <div className="mt-6 flex w-full max-w-sm justify-between text-sm">
        <button onClick={prev} disabled={index === 0} className="px-4 py-2 disabled:opacity-30">
          ← 이전
        </button>
        <button onClick={next} className="bg-accent px-6 py-2 text-white">
          {index < words.length - 1 ? '다음 →' : '퀴즈로'}
        </button>
      </div>
      <p className="mt-3 text-xs text-text-muted">좌우로 스와이프해도 넘어갑니다</p>
    </div>
  )
}
