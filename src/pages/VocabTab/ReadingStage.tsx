import { useState } from 'react'
import type { Sentence, VocabWord } from '../../types'
import { tokenizeHanzi } from '../../lib/tokenize'
import { WordBottomSheet } from '../../components/WordBottomSheet'
import { logEvent } from '../../lib/logging'

interface Props {
  sectionSentences: Sentence[]
  sectionComplete: boolean
  words: VocabWord[]
  checked: Set<string>
  onToggleCheck: (wordId: string) => void
  studentId: string | null
  lessonId: string
  onStartFlashcards: () => void
}

export function ReadingStage({
  sectionSentences,
  sectionComplete,
  words,
  checked,
  onToggleCheck,
  studentId,
  lessonId,
  onStartFlashcards,
}: Props) {
  const [activeWord, setActiveWord] = useState<VocabWord | null>(null)

  function openWord(word: VocabWord) {
    setActiveWord(word)
    logEvent(studentId, lessonId, 'word_lookup', word.word_id)
  }

  return (
    <div className="px-4 pb-24 pt-4">
      {!sectionComplete && (
        <div className="mb-4 border border-dashed border-line bg-card px-3 py-2 text-xs text-text-muted">
          이 섹션은 본문 원문 확정 전이라 확인된 문장만 표시됩니다. 원문이 입력되면 전체 지문이
          채워집니다.
        </div>
      )}

      <div className="space-y-3">
        {sectionSentences.map((s) => (
          <p key={s.sentence_id} className="font-hanzi text-xl leading-relaxed">
            {tokenizeHanzi(s.hanzi, words).map((tok, idx) =>
              tok.word ? (
                <button
                  key={idx}
                  onClick={() => openWord(tok.word!)}
                  className="border-b border-dotted border-teal text-inherit"
                >
                  {tok.text}
                </button>
              ) : (
                <span key={idx}>{tok.text}</span>
              ),
            )}
          </p>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium text-text-muted">
          이 섹션의 단어 목록 (탭하면 뜻 보기 · ★ 눌러 체크)
        </p>
        <ul>
          {words.map((w) => (
            <li key={w.word_id} className="flex items-center justify-between divider-line py-2.5">
              <button className="flex-1 text-left" onClick={() => openWord(w)}>
                <span className="font-hanzi text-lg">{w.hanzi}</span>
                <span className="ml-2 text-sm text-text-muted">{w.pinyin}</span>
              </button>
              <button
                aria-label="체크"
                onClick={() => onToggleCheck(w.word_id)}
                className={`px-2 text-xl ${checked.has(w.word_id) ? 'text-accent' : 'text-line'}`}
              >
                {checked.has(w.word_id) ? '★' : '☆'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        disabled={checked.size === 0}
        onClick={onStartFlashcards}
        className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        체크한 단어 {checked.size}개로 플래시카드 시작
      </button>

      <WordBottomSheet
        word={activeWord}
        onClose={() => setActiveWord(null)}
        checked={activeWord ? checked.has(activeWord.word_id) : false}
        onToggleCheck={onToggleCheck}
      />
    </div>
  )
}
