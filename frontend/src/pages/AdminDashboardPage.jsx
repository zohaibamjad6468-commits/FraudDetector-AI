import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../services/api'

export function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, txRes] = await Promise.all([
          api.get('/dashboards/admin/summary'),
          api.get('/transactions?per_page=5')
        ])
        setSummary(dashRes.data.data)
        setRecentTransactions(txRes.data.data.transactions)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-text-muted">Loading dashboard...</div>
  }

  if (!summary) {
    return <div className="flex h-64 items-center justify-center text-risk">Failed to load data.</div>
  }

  const kpiCards = [
    { label: 'Total Transactions', value: summary.totalTransactions.toLocaleString(), trend: 'All time' },
    { label: 'Fraud Rate', value: `${summary.fraudRate}%`, trend: `${summary.fraudCount} cases` },
    { label: 'Pending Reviews', value: summary.pendingReviews.toLocaleString(), trend: 'Requires attention' },
    { label: 'Total Alerts', value: summary.totalAlerts.toLocaleString(), trend: 'Open alerts' }
  ]

  const riskPieSeries = [
    { name: 'High Risk', value: summary.riskDistribution.high, color: '#EF4444' },
    { name: 'Medium Risk', value: summary.riskDistribution.medium, color: '#F59E0B' },
    { name: 'Low Risk', value: summary.riskDistribution.low, color: '#10B981' }
  ]

  const fraudLineSeries = summary.fraudTrend.map(t => ({
    day: t.date,
    flagged: t.fraud,
    cleared: 0 // Mock cleared as we don't track daily clears yet
  })).reverse()

  return (
    <section className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <article key={card.label} className="panel p-4">
            <p className="text-sm text-text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-text">{card.value}</p>
            <p className="mt-1 text-xs text-text-muted">{card.trend}</p>
          </article>
        ))}
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="panel p-4">
          <p className="mb-3 text-sm font-medium text-text">Risk Distribution</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPieSeries} dataKey="value" outerRadius={95} label>
                  {riskPieSeries.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel p-4">
          <p className="mb-3 text-sm font-medium text-text">Recent Fraud Trend</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fraudLineSeries}>
                <XAxis dataKey="day" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="flagged" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="panel overflow-x-auto">
        <p className="px-4 py-3 text-sm font-medium text-text">Recent Transactions</p>
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-bg-alt text-text-muted">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-bg-alt/60">
                <td className="px-4 py-3 text-text">{tx.transactionRef}</td>
                <td className="px-4 py-3 text-text-muted">{tx.merchant || 'Unknown'}</td>
                <td className="px-4 py-3 text-text">${tx.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-text-muted">{tx.status}</td>
                <td className="px-4 py-3 text-text-muted">{tx.riskLevel}</td>
              </tr>
            ))}
            {recentTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-text-muted">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  color: '#1e293b',
}
