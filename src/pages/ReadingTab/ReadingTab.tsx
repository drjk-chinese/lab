import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSentences } from '../../lib/dataSource'
import { useAuth } from '../../contexts/AuthContext'
import { SentenceCard } from './SentenceCard'
import type { SentencesData, Sentence } from '../../types'

const LESSON_ID = 'L01'
const PLATO_URL = import.meta.env.VITE_PLATO_SUBMIT_URL

export function ReadingTab() {
  const { user } = useAuth()
  const [data, setData] = useState<SentencesData | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'full'>('cards')
  const [showPinyin, setShowPinyin] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)
  const [playingAll, setPlayingAll] = useState(false)
  const [searchParams] = useSearchParams()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    getSentences(LESSON_ID).then(setData)
  }, [])

  useEffect(() => {
    const target = searchParams.get('sentence')
    if (!target || !data) return
    const el = document.getElementById(`sentence-${target}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [searchParams, data])

  if (!data) return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>

  const allSentences: Sentence[] = data.sections.flatMap((s) => s.sentences)
  const playable = allSentences.filter((s) => s.audio_url)

  function playAllSequentially(list: Sentence[], i = 0) {
    if (i >= list.length) {
      setPlayingAll(false)
      return
    }
    const s = list[i]
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = s.audio_url as string
    audioRef.current.onended = () => playAllSequentially(list, i + 1)
    void audioRef.current.play()
  }

  function handlePlayAll() {
    if (playable.length === 0) return
    setPlayingAll(true)
    playAllSequentially(playable)
  }

  function handleStopAll() {
    audioRef.current?.pause()
    setPlayingAll(false)
  }

  return (
    <div className="pb-32">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={playingAll ? handleStopAll : handlePlayAll}
            disabled={playable.length === 0}
            className="flex-1 bg-teal py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {playable.length === 0
              ? '전체 듣기 (음원 준비중)'
              : playingAll
                ? '■ 정지'
                : '▶ 전체 듣기'}
          </button>
          <button
            onClick={() => setViewMode((v) => (v === 'cards' ? 'full' : 'cards'))}
            className="border border-line px-3 py-2.5 text-xs text-text-muted"
          >
            {viewMode === 'cards' ? '전체 지문 보기' : '문장카드 보기'}
          </button>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <ToggleRow label="병음" checked={showPinyin} onChange={setShowPinyin} />
          <ToggleRow label="해석" checked={showTranslation} onChange={setShowTranslation} />
          <ToggleRow label="문법" checked={showGrammar} onChange={setShowGrammar} />
        </div>
      </div>

      {data.sections.some((s) => !s.complete) && (
        <p className="border-b border-line bg-card px-4 py-2 text-xs text-text-muted">
          {data.note}
        </p>
      )}

      {viewMode === 'cards' ? (
        <div>
          {allSentences.map((s) => (
            <SentenceCard
              key={s.sentence_id}
              sentence={s}
              showPinyin={showPinyin}
              showTranslation={showTranslation}
              showGrammar={showGrammar}
              studentId={user?.studentId ?? null}
              lessonId={LESSON_ID}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2 px-4 py-4">
          {allSentences.map((s) => (
            <p key={s.sentence_id} id={`sentence-${s.sentence_id}`} className="leading-relaxed">
              <span className="font-hanzi text-xl">{s.hanzi}</span>
              {showPinyin && <span className="block text-sm text-teal">{s.pinyin}</span>}
              {showTranslation && (
                <span className="block text-sm text-text-muted">{s.meaning_kr}</span>
              )}
            </p>
          ))}
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-line bg-bg-app px-4 py-3">
        {PLATO_URL ? (
          <a
            href={PLATO_URL}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-accent py-3 text-center text-sm font-medium text-white"
          >
            낭독 과제는 플라토에서 제출하세요
          </a>
        ) : (
          <button
            disabled
            className="block w-full bg-accent py-3 text-center text-sm font-medium text-white opacity-50"
            title="플라토 URL이 아직 설정되지 않았습니다"
          >
            낭독 과제는 플라토에서 제출하세요
          </button>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-1.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
