import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'

interface ActivityRow {
  student_id: string
  lesson_id: string
  login_count: number
  words_checked: number
  quiz_answers: number
  quiz_correct: number
  sentence_plays: number
  recordings: number
  session_span_seconds: number | null
}

export function AdminActivityDashboard() {
  const [rows, setRows] = useState<ActivityRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    supabase
      .from('student_activity_summary')
      .select('*')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setRows((data ?? []) as ActivityRow[])
      })
  }, [])

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
      <table className="w-full min-w-[600px] border-collapse text-xs">
        <thead>
          <tr className="divider-line text-left text-text-muted">
            <th className="py-2 pr-3">학번</th>
            <th className="py-2 pr-3">로그인</th>
            <th className="py-2 pr-3">체크 단어</th>
            <th className="py-2 pr-3">퀴즈 정답률</th>
            <th className="py-2 pr-3">문장 재생</th>
            <th className="py-2 pr-3">녹음 횟수</th>
            <th className="py-2 pr-3">체류시간</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
