import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Sentence } from '../../types'
import { logEvent } from '../../lib/logging'

const SPEEDS = [0.75, 1, 1.25] as const

interface Props {
  sentence: Sentence
  showPinyin: boolean
  showTranslation: boolean
  showGrammar: boolean
  studentId: string | null
  lessonId: string
  onRecorded?: (sentenceId: string) => void
}

export function SentenceCard({
  sentence,
  showPinyin,
  showTranslation,
  showGrammar,
  studentId,
  lessonId,
  onRecorded,
}: Props) {
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  function play() {
    if (!sentence.audio_url) return
    if (!audioRef.current) audioRef.current = new Audio(sentence.audio_url)
    audioRef.current.playbackRate = speed
    audioRef.current.currentTime = 0
    void audioRef.current.play()
    logEvent(studentId, lessonId, 'sentence_play', sentence.sentence_id)
  }

  async function toggleRecord() {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
      logEvent(studentId, lessonId, 'record_attempt', sentence.sentence_id)
      onRecorded?.(sentence.sentence_id)
    } catch {
      alert('마이크 권한이 필요합니다.')
    }
  }

  return (
    <div id={`sentence-${sentence.sentence_id}`} className="divider-line px-4 py-4">
      <p className="font-hanzi text-xl leading-relaxed">{sentence.hanzi}</p>
      {showPinyin && <p className="mt-1 text-sm text-teal">{sentence.pinyin}</p>}
      {showTranslation && <p className="mt-1 text-sm text-text-muted">{sentence.meaning_kr}</p>}

      {showGrammar && sentence.grammar_card_ids.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sentence.grammar_card_ids.map((cardId) => (
            <Link
              key={cardId}
              to={`/grammar?card=${cardId}`}
              className="border border-teal bg-teal-soft px-2 py-0.5 text-xs text-teal"
            >
              문법 {cardId} · 더 알아보기
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={play}
          disabled={!sentence.audio_url}
          className="border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          title={sentence.audio_url ? '재생' : '음원 준비중'}
        >
          ▶ {sentence.audio_url ? '재생' : '음원 준비중'}
        </button>

        <div className="flex text-xs">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`border px-2 py-1 ${
                speed === s ? 'border-accent text-accent' : 'border-line text-text-muted'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={toggleRecord}
          className={`border px-3 py-1.5 text-sm ${
            recording ? 'border-accent bg-accent-soft text-accent' : 'border-line'
          }`}
        >
          {recording ? '■ 녹음 중지' : '● 녹음'}
        </button>

        {recordedUrl && (
          <button
            onClick={() => new Audio(recordedUrl).play()}
            className="border border-teal px-3 py-1.5 text-sm text-teal"
          >
            ▶ 내 녹음 듣기
          </button>
        )}
      </div>
    </div>
  )
}
