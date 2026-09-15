import { useEffect, useState } from 'react'
import { getVocab, getSentences } from '../../lib/dataSource'
import { logEvent } from '../../lib/logging'
import { useAuth } from '../../contexts/AuthContext'
import { useSessionState } from '../../hooks/useSessionState'
import { ReadingStage } from './ReadingStage'
import { FlashcardStage } from './FlashcardStage'
import { QuizStage } from './QuizStage'
import type { VocabData, VocabWord, SentencesData } from '../../types'

const LESSON_ID = 'L01'

type Stage = 'reading' | 'flashcards' | 'quiz' | 'retry-flashcards' | 'retry-quiz' | 'done'

export function VocabTab() {
  const { user } = useAuth()
  const [vocab, setVocab] = useState<VocabData | null>(null)
  const [sentences, setSentences] = useState<SentencesData | null>(null)
  const [sectionIdx, setSectionIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('reading')
  const [retryWords, setRetryWords] = useState<VocabWord[]>([])

  const [checked, setChecked] = useSessionState<string[]>(`checked_words_${LESSON_ID}`, [])
  const checkedSet = new Set(checked)

  useEffect(() => {
    getVocab(LESSON_ID).then(setVocab)
    getSentences(LESSON_ID).then(setSentences)
  }, [])

  if (!vocab || !sentences) {
    return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>
  }

  const section = vocab.sections[sectionIdx]
  const sentenceSection = sentences.sections.find((s) => s.section_id === section.section_id)
  const checkedWordsInSection = section.words.filter((w) => checkedSet.has(w.word_id))
  const allWords = vocab.sections.flatMap((s) => s.words)

  function toggleCheck(wordId: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      const willCheck = !next.has(wordId)
      if (willCheck) next.add(wordId)
      else next.delete(wordId)
      if (willCheck) logEvent(user?.studentId ?? null, LESSON_ID, 'word_check', wordId)
      return Array.from(next)
    })
  }

  function changeSection(idx: number) {
    setSectionIdx(idx)
    setStage('reading')
    setRetryWords([])
  }

  return (
    <div>
      <div className="flex border-b border-line px-2">
        {vocab.sections.map((s, idx) => (
          <button
            key={s.section_id}
            onClick={() => changeSection(idx)}
            className={`flex-1 py-3 text-sm font-medium ${
              idx === sectionIdx ? 'border-b-2 border-accent text-accent' : 'text-text-muted'
            }`}
          >
            섹션 {idx + 1}
          </button>
        ))}
      </div>

      {stage === 'reading' && (
        <ReadingStage
          sectionSentences={sentenceSection?.sentences ?? []}
          sectionComplete={sentenceSection?.complete ?? false}
          words={section.words}
          checked={checkedSet}
          onToggleCheck={toggleCheck}
          studentId={user?.studentId ?? null}
          lessonId={LESSON_ID}
          onStartFlashcards={() => setStage('flashcards')}
        />
      )}

      {stage === 'flashcards' && (
        <FlashcardStage
          words={checkedWordsInSection}
          studentId={user?.studentId ?? null}
          lessonId={LESSON_ID}
          title="플래시카드"
          onDone={() => setStage('quiz')}
        />
      )}

      {stage === 'quiz' && (
        <QuizStage
          words={checkedWordsInSection}
          pool={allWords}
          studentId={user?.studentId ?? null}
          lessonId={LESSON_ID}
          title="자가퀴즈"
          onFinish={(wrong) => {
            if (wrong.length > 0) {
              setRetryWords(wrong)
              setStage('retry-flashcards')
            } else {
              setStage('done')
            }
          }}
        />
      )}

      {stage === 'retry-flashcards' && (
        <FlashcardStage
          words={retryWords}
          studentId={user?.studentId ?? null}
          lessonId={LESSON_ID}
          title="오답 재플래시카드"
          onDone={() => setStage('retry-quiz')}
        />
      )}

      {stage === 'retry-quiz' && (
        <QuizStage
          words={retryWords}
          pool={allWords}
          studentId={user?.studentId ?? null}
          lessonId={LESSON_ID}
          title="재퀴즈"
          onFinish={(wrong) => {
            if (wrong.length > 0) {
              setRetryWords(wrong)
              setStage('retry-flashcards')
            } else {
              setStage('done')
            }
          }}
        />
      )}

      {stage === 'done' && (
        <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-lg font-semibold">🎉 이 섹션 예습 완료!</p>
          <p className="text-sm text-text-muted">
            체크한 단어 {checkedWordsInSection.length}개를 모두 맞혔어요.
          </p>
          <button
            onClick={() => setStage('reading')}
            className="border border-line px-4 py-2 text-sm"
          >
            본문으로 돌아가기
          </button>
        </div>
      )}
    </div>
  )
}
