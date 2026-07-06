import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './components/AppShell'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AnalystDashboardPage } from './pages/AnalystDashboardPage'
import { AnalystHomePage } from './pages/AnalystHomePage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { DetectionPage } from './pages/DetectionPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole role="admin">
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/analyst/dashboard"
            element={
              <RequireRole role="analyst">
                <AnalystHomePage />
              </RequireRole>
            }
          />
          <Route path="/review" element={<AnalystDashboardPage />} />
          <Route path="/detect" element={<DetectionPage />} />
          <Route path="/analytics" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/analytics/:section" element={<AdminDashboardPage />} />
          <Route path="/transactions" element={<HistoryPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/audit-logs"
            element={<AuditLogsPage />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

function RequireRole({ role, children }) {
  const { session } = useAuth()
  if (session?.role !== role) {
    return <Navigate to={session?.role === 'admin' ? '/admin/dashboard' : '/analyst/dashboard'} replace />
  }
  return children
}

function RoleHomeRedirect() {
  const { session } = useAuth()
  return <Navigate to={session?.role === 'admin' ? '/admin/dashboard' : '/analyst/dashboard'} replace />
}

export default App
