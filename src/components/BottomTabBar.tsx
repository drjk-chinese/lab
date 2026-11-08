import { NavLink } from 'react-router-dom'
import { useLesson } from '../contexts/LessonContext'
import { LESSONS } from '../data/lessons'

const TABS = [
  { to: '/vocab', label: '단어예습', icon: '📖' },
  { to: '/reading', label: '낭독', icon: '🔊' },
  { to: '/grammar', label: '문법', icon: '🧩' },
]

const QUIZ_TAB = { to: '/quiz', label: '퀴즈', icon: '✏️' }

export function BottomTabBar() {
  const { lessonId } = useLesson()
  const hasQuiz = LESSONS.find((l) => l.id === lessonId)?.hasQuiz ?? false
  const tabs = hasQuiz ? [...TABS, QUIZ_TAB] : TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-bg-app"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              isActive ? 'text-accent' : 'text-text-muted'
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
