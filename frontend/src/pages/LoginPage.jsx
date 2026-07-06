import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await login({ email, password, remember })
    if (!result.ok) {
      setLoading(false)
      setError(result.message)
      return
    }

    const fallback = result.role === 'admin' ? '/admin/dashboard' : '/analyst/dashboard'
    const next = location.state?.from?.pathname ?? fallback
    navigate(next, { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="panel w-full p-6"
      >
        <div className="mb-5">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-brand-soft">
            <ShieldCheck size={14} />
            FinGuard AI Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-text">Sign in</h1>
          <p className="text-sm text-text-muted">Role-based access for Admin and Analyst</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-text-muted">
            Email
            <input
              type="email"
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@finguard.ai"
              required
            />
          </label>
          <label className="block text-sm text-text-muted">
            Password
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
        </div>

        <label className="mt-3 inline-flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        {error ? (
          <p className="mt-3 rounded-md border border-risk/40 bg-risk/10 px-3 py-2 text-sm text-risk">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p className="mt-4 text-xs text-text-muted">
          Demo users: admin@finguard.ai / admin123, analyst@finguard.ai / analyst123
        </p>
      </motion.form>
    </div>
  )
}
