import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLesson } from '../contexts/LessonContext'
import { LESSONS } from '../data/lessons'

const TITLES: Record<string, string> = {
  '/vocab': '단어예습',
  '/reading': '낭독',
  '/grammar': '문법',
  '/admin': '관리자',
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const { lessonId, setLessonId } = useLesson()
  const location = useLocation()
  const title = TITLES[location.pathname] ?? '초급중국어읽기'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg-app px-4 py-3">
      <div>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="border-0 bg-transparent p-0 text-[11px] text-text-muted"
          aria-label="과 선택"
        >
          {LESSONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} · {l.title}
            </option>
          ))}
        </select>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {user?.role === 'admin' && (
          <Link to="/admin" className="border border-teal px-2 py-1 text-teal">
            관리자
          </Link>
        )}
        <span>{user?.name ? `${user.studentId} ${user.name}님` : user?.studentId}</span>
        <button onClick={() => void logout()} className="underline">
          로그아웃
        </button>
      </div>
    </header>
  )
}
