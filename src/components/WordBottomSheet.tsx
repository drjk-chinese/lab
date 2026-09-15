import type { VocabWord } from '../types'

interface Props {
  word: VocabWord | null
  onClose: () => void
  checked?: boolean
  onToggleCheck?: (wordId: string) => void
}

export function WordBottomSheet({ word, onClose, checked, onToggleCheck }: Props) {
  if (!word) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="닫기"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl bg-bg-app px-5 pb-8 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-start justify-between">
          <div>
            <p className="font-hanzi text-3xl font-semibold">{word.hanzi}</p>
            <p className="mt-1 text-sm text-teal">{word.pinyin}</p>
          </div>
          {onToggleCheck && (
            <button
              aria-label="체크"
              onClick={() => onToggleCheck(word.word_id)}
              className={`text-2xl ${checked ? 'text-accent' : 'text-line'}`}
            >
              {checked ? '★' : '☆'}
            </button>
          )}
        </div>
        <p className="mt-1 text-base">{word.meaning_kr}</p>

        <div className="mt-4 border-t border-line pt-3">
          <p className="font-hanzi text-lg">{word.example.text}</p>
          <p className="mt-1 text-sm text-text-muted">{word.example.pinyin}</p>
          <p className="mt-1 text-sm text-text-muted">{word.example.meaning_kr}</p>
        </div>
      </div>
    </div>
  )
}
