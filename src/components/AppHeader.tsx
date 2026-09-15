import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TITLES: Record<string, string> = {
  '/vocab': '단어예습',
  '/reading': '낭독',
  '/grammar': '문법',
  '/admin': '관리자',
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const title = TITLES[location.pathname] ?? '可乐与扣肉'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg-app px-4 py-3">
      <div>
        <p className="text-[11px] text-text-muted">L01 · 可乐与扣肉</p>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        {user?.role === 'admin' && (
          <Link to="/admin" className="border border-teal px-2 py-1 text-teal">
            관리자
          </Link>
        )}
        <span>{user?.studentId}</span>
        <button onClick={() => void logout()} className="underline">
          로그아웃
        </button>
      </div>
    </header>
  )
}
