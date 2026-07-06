import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../services/api'

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  color: '#1e293b',
}

export function AnalystHomePage() {
  const [summary, setSummary] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      // Fetch each independently so one failure doesn't break the whole page
      let dashData = {
        totalTransactions: 0, fraudCount: 0, fraudRate: 0,
        pendingReviews: 0, blockedTransactions: 0, approvedTransactions: 0,
        totalAlerts: 0,
        riskDistribution: { high: 0, medium: 0, low: 0 },
        fraudTrend: []
      }
      try {
        const res = await api.get('/dashboards/analyst/summary')
        dashData = res.data.data
      } catch (e) { console.error('Dashboard summary failed', e) }

      try {
        const res = await api.get('/transactions?per_page=5')
        setRecentTx(res.data.data.transactions)
      } catch (e) { console.error('Transactions failed', e) }

      try {
        const res = await api.get('/cases/queue')
        setPendingCount(res.data.data.cases?.length ?? 0)
      } catch (e) { console.error('Cases queue failed', e) }

      setSummary(dashData)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Loading analyst dashboard...
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center text-risk">
        Failed to load dashboard data.
      </div>
    )
  }

  const kpiCards = [
    {
      label: 'Pending Reviews',
      value: pendingCount,
      sub: 'Awaiting your decision',
      tone: pendingCount > 0 ? 'warn' : 'safe',
    },
    {
      label: 'Total Transactions',
      value: summary.totalTransactions,
      sub: 'All time',
      tone: 'neutral',
    },
    {
      label: 'Fraud Rate',
      value: `${summary.fraudRate}%`,
      sub: `${summary.fraudCount} fraud cases`,
      tone: summary.fraudRate > 10 ? 'risk' : 'safe',
    },
    {
      label: 'Open Alerts',
      value: summary.totalAlerts,
      sub: 'Active alerts',
      tone: summary.totalAlerts > 0 ? 'warn' : 'safe',
    },
  ]

  const riskPie = [
    { name: 'High Risk', value: summary.riskDistribution.high, color: '#EF4444' },
    { name: 'Medium Risk', value: summary.riskDistribution.medium, color: '#F59E0B' },
    { name: 'Low Risk', value: summary.riskDistribution.low, color: '#10B981' },
  ]

  const trendBars = summary.fraudTrend
    .map((t) => ({ date: t.date, fraud: t.fraud }))
    .reverse()

  const toneClass = (t) =>
    t === 'risk'
      ? 'text-risk'
      : t === 'warn'
        ? 'text-warn'
        : t === 'safe'
          ? 'text-safe'
          : 'text-text'

  return (
    <section className="space-y-4">
      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpiCards.map((card) => (
          <article
            key={card.label}
            className="panel flex flex-col justify-between p-4"
          >
            <p className="text-sm text-text-muted">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${toneClass(card.tone)}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{card.sub}</p>
          </article>
        ))}
      </motion.div>

      {/* Quick Action Banner */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="panel flex items-center justify-between border-warn/40 bg-warn/5 p-4"
        >
          <div>
            <p className="font-semibold text-text">
              ⚠️ {pendingCount} case{pendingCount > 1 ? 's' : ''} awaiting
              review
            </p>
            <p className="text-sm text-text-muted">
              Suspicious transactions need your expert analysis.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => navigate('/review')}
          >
            Open Review Queue
          </button>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="panel p-4"
        >
          <p className="mb-3 text-sm font-medium text-text">
            Risk Distribution
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPie} dataKey="value" outerRadius={95} label>
                  {riskPie.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="panel p-4"
        >
          <p className="mb-3 text-sm font-medium text-text">
            Fraud Trend (Recent Days)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendBars}>
                <XAxis dataKey="date" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="fraud" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </div>

      {/* Recent Transactions Table */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="panel overflow-x-auto"
      >
        <p className="px-4 py-3 text-sm font-medium text-text">
          Recent Transactions
        </p>
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-bg-alt text-text-muted">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentTx.map((tx) => (
              <tr key={tx.id} className="hover:bg-bg-alt/60">
                <td className="px-4 py-3 text-text">
                  {tx.transactionRef?.slice(0, 12)}…
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {tx.merchant || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-text">
                  ${tx.amount?.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.status === 'Blocked'
                        ? 'bg-risk/15 text-risk'
                        : tx.status === 'Approved'
                          ? 'bg-safe/15 text-safe'
                          : 'bg-warn/15 text-warn'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium ${
                      tx.riskLevel === 'High'
                        ? 'text-risk'
                        : tx.riskLevel === 'Medium'
                          ? 'text-warn'
                          : 'text-safe'
                    }`}
                  >
                    {tx.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {tx.fraudProbability != null
                    ? `${(tx.fraudProbability * 100).toFixed(0)}%`
                    : '—'}
                </td>
              </tr>
            ))}
            {recentTx.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-6 text-center text-text-muted"
                >
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.article>
    </section>
  )
}
