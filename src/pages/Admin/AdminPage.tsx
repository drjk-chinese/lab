import { useState } from 'react'
import { AdminContentEditor } from './AdminContentEditor'
import { AdminActivityDashboard } from './AdminActivityDashboard'

export function AdminPage() {
  const [tab, setTab] = useState<'content' | 'activity'>('content')

  return (
    <div>
      <div className="flex border-b border-line px-2">
        <button
          onClick={() => setTab('content')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'content' ? 'border-b-2 border-accent text-accent' : 'text-text-muted'
          }`}
        >
          콘텐츠 편집
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'activity' ? 'border-b-2 border-accent text-accent' : 'text-text-muted'
          }`}
        >
          활동현황
        </button>
      </div>

      {tab === 'content' ? <AdminContentEditor /> : <AdminActivityDashboard />}
    </div>
  )
}
