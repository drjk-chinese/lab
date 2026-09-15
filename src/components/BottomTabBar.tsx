import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/vocab', label: '단어예습', icon: '📖' },
  { to: '/reading', label: '낭독', icon: '🔊' },
  { to: '/grammar', label: '문법', icon: '🧩' },
]

export function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-line bg-bg-app"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => (
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
