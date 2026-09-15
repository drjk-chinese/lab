import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppHeader } from './components/AppHeader'
import { BottomTabBar } from './components/BottomTabBar'
import { LoginPage } from './pages/LoginPage'
import { VocabTab } from './pages/VocabTab/VocabTab'
import { ReadingTab } from './pages/ReadingTab/ReadingTab'
import { GrammarTab } from './pages/GrammarTab/GrammarTab'
import { AdminPage } from './pages/Admin/AdminPage'

function AppLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col pb-16">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/vocab" replace />
  return <>{children}</>
}

function RedirectIfAuthed() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>
  if (user) return <Navigate to="/vocab" replace />
  return <LoginPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/vocab" element={<VocabTab />} />
        <Route path="/reading" element={<ReadingTab />} />
        <Route path="/grammar" element={<GrammarTab />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/vocab" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
