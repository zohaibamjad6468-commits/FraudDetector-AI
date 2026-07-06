import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RiskBadge } from '../components/RiskBadge'
import api from '../services/api'

export function AnalystDashboardPage() {
  const [queue, setQueue] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get('/cases/queue')
      const cases = res.data.data.cases
      setQueue(cases)
      setSelectedId((currentId) => currentId ?? cases[0]?.id ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const selected = useMemo(
    () => queue.find((c) => c.id === selectedId) ?? queue[0],
    [selectedId, queue],
  )

  const handleDecision = async (decisionLabel, decisionVal) => {
    if (!selected) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/cases/${selected.id}/decision`, { decision: decisionVal })
      setSuccess(`Case marked as ${decisionLabel}`)
      // remove from queue
      setQueue(q => q.filter(c => c.id !== selected.id))
      setSelectedId(queue.filter(c => c.id !== selected.id)[0]?.id)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update decision')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-4 text-text-muted">Loading queue...</div>

  if (queue.length === 0) {
    return (
      <section className="flex h-64 flex-col items-center justify-center p-8 text-center text-text-muted">
        <h2 className="text-xl font-semibold text-text">No pending cases</h2>
        <p className="mt-2">The review queue is currently empty.</p>
      </section>
    )
  }

  const riskScore = Math.round((selected?.fraudProbability ?? 0) * 100)
  const level = riskScore >= 75 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low'

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel p-4">
        <h2 className="text-lg font-semibold text-text">Pending Transactions Queue</h2>
        <div className="mt-3 space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {queue.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-md border px-3 py-2 text-left ${
                item.id === selectedId
                  ? 'border-brand bg-brand/10'
                  : 'border-border bg-bg-alt hover:border-brand/60'
              }`}
            >
              <p className="text-sm text-text">{item.caseRef} - {item.transactionId}</p>
              <p className="text-xs text-text-muted">Risk Score {(item.fraudProbability * 100).toFixed(0)} | ${item.amount}</p>
            </button>
          ))}
        </div>
      </motion.article>

      <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="panel p-5">
        <p className="text-xs uppercase tracking-[0.15em] text-brand-soft">Analyst Decision Workspace</p>
        <h3 className="mt-2 text-xl font-semibold text-text">{selected.transactionId} - {selected.merchant || 'Unknown Merchant'}</h3>
        <p className="text-sm text-text-muted">${selected.amount} | Priority: {selected.priority}</p>

        <div className="mt-4 rounded-lg border border-border bg-bg-alt p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-text-muted">Risk score meter</span>
            <span className="text-sm font-semibold text-text">{riskScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-surface-soft">
            <div
              className={`h-2 rounded-full ${level === 'High' ? 'bg-risk' : level === 'Medium' ? 'bg-warn' : 'bg-safe'}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-text-muted">AI prediction</span>
            <RiskBadge level={level} />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-bg-alt p-4">
          <p className="text-sm font-medium text-text">Fraud explanation</p>
          <ul className="mt-2 space-y-1 text-xs text-text-muted">
            {selected.explanations?.length > 0 ? selected.explanations.map((item) => (
              <li key={item.feature}>
                {item.feature}: {item.note}
              </li>
            )) : <li>No specific explanations provided.</li>}
          </ul>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" disabled={actionLoading} className="btn-secondary border-risk/50 text-risk disabled:opacity-50" onClick={() => handleDecision('Fraud', 'fraud')}>
            Mark as Fraud
          </button>
          <button type="button" disabled={actionLoading} className="btn-secondary border-safe/50 text-safe disabled:opacity-50" onClick={() => handleDecision('Safe', 'safe')}>
            Mark as Safe
          </button>
          <button type="button" disabled={actionLoading} className="btn-primary disabled:opacity-50" onClick={() => handleDecision('In Review', 'review')}>
            Keep in Review
          </button>
        </div>
        
        {error && <p className="mt-3 rounded text-sm text-risk bg-risk/10 p-2">{error}</p>}
        {success && <p className="mt-3 rounded text-sm text-safe bg-safe/10 p-2">{success}</p>}
      </motion.article>
    </section>
  )
}
