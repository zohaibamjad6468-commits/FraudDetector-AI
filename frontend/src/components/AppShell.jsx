import { NavLink, Outlet } from 'react-router-dom'
import { Bell, ClipboardList, CreditCard, LayoutDashboard, ShieldAlert, Clock } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { useAlertPolling } from '../hooks/useAlertPolling'
import { motion, AnimatePresence } from 'framer-motion'

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Bell },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
]

const analystNav = [
  { to: '/analyst/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/review', label: 'Review Queue', icon: ShieldAlert },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/detect', label: 'Detection Tool', icon: ShieldAlert },
]

export function AppShell() {
  const { session, logout } = useAuth()
  const navItems = session?.role === 'admin' ? adminNav : analystNav
  const { showWarning, remainingSeconds } = useIdleTimeout()

  // Activate real-time alert polling
  useAlertPolling()

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 md:px-6">
      {/* Session Timeout Warning Banner */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(245, 158, 11, 0.15)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#92400e',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Clock size={18} />
            <span>
              Session expires in {remainingSeconds}s due to inactivity.
            </span>
            <button
              onClick={() => window.dispatchEvent(new Event('mousemove'))}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#92400e',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Stay Logged In
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-6 border-b border-border pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-soft">
              FinGuard AI
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-text md:text-[1.75rem]">
              Credit Card Fraud Intelligence
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text-muted">
              {session?.role === 'admin' ? 'Admin' : 'Analyst'} - {session?.name}
            </div>
            <button type="button" onClick={logout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  isActive
                    ? 'border-brand bg-brand/15 text-text'
                    : 'border-border bg-bg-alt text-text-muted hover:border-brand/60 hover:text-text'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
