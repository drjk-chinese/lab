import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, loginAsDemoAdmin, isDemoMode, error } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await login(studentId, password)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="text-sm text-teal font-medium">초급중국어읽기 · AI 챕터</p>
        <h1 className="mt-1 font-hanzi text-2xl font-semibold">可乐与扣肉</h1>
        <p className="mt-1 text-sm text-text-muted">학번으로 로그인해 주세요.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          학번
          <input
            className="divider-line rounded-none border-0 border-b bg-transparent px-1 py-2 text-base outline-none focus:border-accent"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="예: 20251234"
            autoComplete="username"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          비밀번호
          <input
            className="divider-line rounded-none border-0 border-b bg-transparent px-1 py-2 text-base outline-none focus:border-accent"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="학번과 동일한 비밀번호"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-3 bg-accent py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>

      {isDemoMode && (
        <div className="mt-4 border-t border-line pt-4 text-xs text-text-muted">
          <p>
            Supabase 연동 전 <b>데모 모드</b>입니다. 아무 학번/비밀번호로 로그인하면 학생 화면을
            바로 미리볼 수 있어요.
          </p>
          <button
            onClick={loginAsDemoAdmin}
            className="mt-2 border border-teal px-3 py-1.5 text-teal"
          >
            관리자 화면 데모로 보기
          </button>
        </div>
      )}
    </div>
  )
}
