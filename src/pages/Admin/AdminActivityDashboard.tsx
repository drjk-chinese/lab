import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useLesson } from '../../contexts/LessonContext'

interface ActivityRow {
  student_id: string
  lesson_id: string
  login_count: number
  words_checked: number
  quiz_answers: number
  quiz_correct: number
  sentence_plays: number
  recordings: number
  first_active_at: string | null
  last_active_at: string | null
  session_span_seconds: number | null
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

function formatDateTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminActivityDashboard() {
  const { lessonId } = useLesson()
  const [rows, setRows] = useState<ActivityRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    setRows(null)
    supabase
      .from('student_activity_summary')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('last_active_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setRows((data ?? []) as ActivityRow[])
      })
  }, [lessonId])

  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-6 text-sm text-text-muted">
        Supabase가 연결되어 있지 않아 활동현황을 표시할 수 없습니다. 환경변수를 설정하면
        `student_activity_summary` 뷰(supabase/schema.sql)를 기반으로 집계표가 표시됩니다.
      </div>
    )
  }

  if (error) return <div className="px-4 py-6 text-sm text-accent">불러오기 실패: {error}</div>
  if (!rows) return <div className="px-4 py-6 text-sm text-text-muted">불러오는 중…</div>

  return (
    <div className="overflow-x-auto px-4 py-4">
      <table className="w-full min-w-[800px] border-collapse text-xs">
        <thead>
          <tr className="divider-line text-left text-text-muted">
            <th className="py-2 pr-3">학번</th>
            <th className="py-2 pr-3">로그인</th>
            <th className="py-2 pr-3">체크 단어</th>
            <th className="py-2 pr-3">퀴즈 정답률</th>
            <th className="py-2 pr-3">문장 재생</th>
            <th className="py-2 pr-3">녹음 횟수</th>
            <th className="py-2 pr-3">체류시간</th>
            <th className="py-2 pr-3">시작일</th>
            <th className="py-2 pr-3">최근활동</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.student_id}-${r.lesson_id}`} className="divider-line">
              <td className="py-2 pr-3">{r.student_id}</td>
              <td className="py-2 pr-3">{r.login_count}</td>
              <td className="py-2 pr-3">{r.words_checked}</td>
              <td className="py-2 pr-3">
                {r.quiz_answers > 0 ? `${Math.round((r.quiz_correct / r.quiz_answers) * 100)}%` : '-'}
              </td>
              <td className="py-2 pr-3">{r.sentence_plays}</td>
              <td className="py-2 pr-3">{r.recordings}</td>
              <td className="py-2 pr-3">
                {r.session_span_seconds ? `${Math.round(r.session_span_seconds / 60)}분` : '-'}
              </td>
              <td className="py-2 pr-3">{formatDate(r.first_active_at)}</td>
              <td className="py-2 pr-3">{formatDateTime(r.last_active_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
