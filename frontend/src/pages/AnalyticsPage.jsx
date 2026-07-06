import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  ChartNoAxesColumnIncreasing,
  LayoutGrid,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react'
import { NavLink, Navigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
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
import { RiskBadge } from '../components/RiskBadge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'

const fraudActivitySeries = [
  { slot: '00:00', activity: 12 },
  { slot: '04:00', activity: 8 },
  { slot: '08:00', activity: 34 },
  { slot: '12:00', activity: 56 },
  { slot: '16:00', activity: 42 },
  { slot: '20:00', activity: 28 },
]
const fraudLineSeries = [
  { day: 'Mon', flagged: 12, cleared: 10 },
  { day: 'Tue', flagged: 19, cleared: 18 },
  { day: 'Wed', flagged: 15, cleared: 14 },
  { day: 'Thu', flagged: 22, cleared: 20 },
  { day: 'Fri', flagged: 28, cleared: 24 },
  { day: 'Sat', flagged: 35, cleared: 30 },
  { day: 'Sun', flagged: 24, cleared: 22 },
]
const kpiCards = [
  { label: 'System Active', value: '100%', trend: 'Operational', tone: 'safe' }
]
const pendingReviewQueue = []
const recentAlerts = []
const riskOverview = [
  { label: 'High Risk', value: 8, tone: 'risk' },
  { label: 'Medium Risk', value: 12, tone: 'warn' },
  { label: 'Low Risk', value: 80, tone: 'safe' },
]
const riskPieSeries = [
  { name: 'Fraud', value: 15, color: '#f43f5e' },
  { name: 'Legit', value: 85, color: '#10b981' },
]
const suspiciousMonitoring = []
const transactions = []

const sections = [
  { key: 'executive', label: 'Main Dashboard', icon: LayoutGrid },
  { key: 'fraud-analytics', label: 'Fraud Analytics', icon: ChartNoAxesColumnIncreasing },
  { key: 'risk-signals', label: 'Risk Signals', icon: ShieldAlert },
  { key: 'alert-queue', label: 'Alert Queue', icon: Bell },
  { key: 'model-health', label: 'Model Health', icon: UserCircle2 },
]

export function AnalyticsPage() {
  const { section } = useParams()
  const currentSection = sections.some((s) => s.key === section) ? section : 'executive'

  if (section !== currentSection) return <Navigate to="/analytics/executive" replace />

  return (
    <section className="grid gap-4 xl:grid-cols-[220px_1fr]">
      <aside className="panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-soft">Navigation</p>
        <nav className="mt-4 space-y-2">
          {sections.map(({ key, label, icon: Icon }) => (
            <NavLink
              key={key}
              to={`/analytics/${key}`}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  isActive
                    ? 'border-brand bg-brand/15 text-text'
                    : 'border-border bg-bg-alt text-text-muted hover:border-cyan-400/45 hover:text-text'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="space-y-4">
        <div className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text">Fraud Detection Dashboard</h2>
            <p className="text-sm text-text-muted">Real-time monitoring and analyst decision support</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border bg-bg-alt px-3 py-2 text-text-muted">
              <div className="flex items-center gap-2">
              <Search size={15} />
              <span className="text-sm">Search events</span>
              </div>
            </div>
            <button type="button" className="rounded-lg border border-border bg-bg-alt p-2 text-text-muted"><Bell size={16} /></button>
            <button type="button" className="rounded-lg border border-border bg-bg-alt p-2 text-text-muted"><UserCircle2 size={16} /></button>
          </div>
        </div>

        <SectionViewport key={currentSection} section={currentSection} />
      </div>
    </section>
  )
}

function SectionViewport({ section }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <div className="panel p-5"><LoadingSkeleton rows={5} /></div>
  return <SectionContent section={section} />
}

function SectionContent({ section }) {
  if (section === 'fraud-analytics') return <FraudAnalytics />
  if (section === 'risk-signals') return <RiskSignals />
  if (section === 'alert-queue') return <AlertQueue />
  if (section === 'model-health') return <ModelHealth />
  return <ExecutiveDashboard />
}

function ExecutiveDashboard() {
  const [liveFeed, setLiveFeed] = useState(recentAlerts)

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveFeed((prev) => {
        const rotated = [...prev]
        const first = rotated.shift()
        if (first) rotated.push(first)
        return rotated
      })
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const riskScore = useMemo(() => {
    const highWeight = riskOverview.find((x) => x.label === 'High Risk')?.value ?? 0
    const mediumWeight = riskOverview.find((x) => x.label === 'Medium Risk')?.value ?? 0
    return Math.min(100, Math.round(highWeight * 7 + mediumWeight * 2.5))
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.slice(0, 4).map((card) => (
          <article key={card.label} className="panel p-4">
            <p className="text-sm text-text-muted">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-text">{card.value}</p>
            <p className={`mt-1 text-xs ${toneClass(card.tone)}`}>{card.trend}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel p-4">
          <h3 className="text-sm font-medium text-text">Real-Time Transaction Monitoring Feed</h3>
          <div className="mt-3 space-y-2">
            {liveFeed.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-md border border-border bg-bg-alt px-3 py-2">
                <div>
                  <p className="text-sm text-text">{alert.id} - {alert.merchant}</p>
                  <p className="text-xs text-text-muted">{alert.reason}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  alert.riskLevel === 'High'
                    ? 'bg-risk/20 text-risk'
                    : 'bg-warn/20 text-warn'
                }`}>{alert.riskLevel}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel p-4">
          <h3 className="text-sm font-medium text-text">Risk Overview</h3>
          <p className="mt-2 text-3xl font-semibold text-text">{riskScore}/100</p>
          <p className="text-xs text-text-muted">Portfolio risk score</p>
          <div className="mt-4 space-y-2">
            {riskOverview.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-xs text-text-muted">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-1.5 rounded bg-surface-soft">
                  <div
                    className={`h-1.5 rounded ${
                      item.tone === 'risk' ? 'bg-risk' : item.tone === 'safe' ? 'bg-safe' : 'bg-warn'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Fraud vs Legit Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskPieSeries} outerRadius={95} dataKey="value" label>
                {riskPieSeries.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Transaction Trend Line">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fraudLineSeries}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="flagged" stroke="#f43f5e" strokeWidth={3} dot={false} />
              <Line dataKey="cleared" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <ChartPanel title="Fraud Activity Bar Chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fraudActivitySeries}>
            <XAxis dataKey="slot" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="activity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
      <article className="panel overflow-x-auto">
        <p className="px-4 py-3 text-sm font-medium text-text">Recent Transactions</p>
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-bg-alt text-text-muted">
            <tr>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Probability</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.slice(0, 5).map((tx) => (
              <tr key={tx.id} className="hover:bg-bg-alt/70">
                <td className="px-4 py-3 text-text">{tx.id}</td>
                <td className="px-4 py-3 text-text-muted">{tx.merchant}</td>
                <td className="px-4 py-3 text-text">{tx.amount}</td>
                <td className="px-4 py-3 text-text-muted">{(tx.fraudProbability * 100).toFixed(0)}%</td>
                <td className="px-4 py-3"><RiskBadge level={tx.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      <article className="panel p-4">
        <h3 className="text-sm font-medium text-text">Pending Review Queue</h3>
        <div className="mt-3 space-y-2">
          {pendingReviewQueue.map((item) => (
            <div key={item.caseId} className="rounded-md border border-border bg-bg-alt px-3 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text">{item.caseId}</span>
                <span className={`${item.prediction === 'Fraud' ? 'text-risk' : 'text-warn'} text-xs font-medium`}>
                  {item.prediction}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">{item.transactionId} | {item.amount}</p>
              <p className="text-xs text-text-muted">Risk score: {item.riskScore}</p>
            </div>
          ))}
        </div>
      </article>
      </section>
    </motion.div>
  )
}

function FraudAnalytics() {
  return (
    <div className="space-y-4">
      <ChartPanel title="Fraud Activity Pattern">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fraudLineSeries}>
            <XAxis dataKey="day" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Line dataKey="flagged" stroke="#EF4444" strokeWidth={2} />
            <Line dataKey="cleared" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  )
}

function RiskSignals() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {suspiciousMonitoring.map((item) => (
        <article key={item.title} className="panel p-4">
          <p className="text-sm text-text">{item.title}</p>
          <p className="mt-1 text-xs text-text-muted">{item.detail}</p>
          <p className={`mt-2 text-xs font-medium ${item.severity === 'High' ? 'text-risk' : 'text-warn'}`}>{item.severity}</p>
        </article>
      ))}
    </div>
  )
}

function AlertQueue() {
  return (
    <div className="space-y-3">
      {recentAlerts.map((alert) => (
        <article key={alert.id} className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">{alert.id} - {alert.merchant}</p>
            <RiskBadge level={alert.riskLevel} />
          </div>
          <p className="mt-2 text-xs text-text-muted">{alert.reason}</p>
        </article>
      ))}
    </div>
  )
}

function ModelHealth() {
  const metrics = [
    { label: 'AUC', value: '0.972', tone: 'safe' },
    { label: 'Precision', value: '0.914', tone: 'safe' },
    { label: 'Recall', value: '0.892', tone: 'warn' },
    { label: 'Latency', value: '118ms', tone: 'safe' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metrics.map((m) => (
        <article key={m.label} className="panel p-4">
          <p className="text-sm text-text-muted">{m.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${toneClass(m.tone)}`}>{m.value}</p>
        </article>
      ))}
      <article className="panel p-4 sm:col-span-2">
        <p className="inline-flex items-center gap-2 text-sm text-safe"><ShieldCheck size={16} />Model status healthy</p>
      </article>
    </div>
  )
}

function ChartPanel({ title, children }) {
  return (
    <article className="panel p-4">
      <p className="mb-3 text-sm font-medium text-text">{title}</p>
      <div className="h-72">{children}</div>
    </article>
  )
}

function toneClass(tone) {
  if (tone === 'danger' || tone === 'risk') return 'text-risk'
  if (tone === 'positive' || tone === 'safe') return 'text-safe'
  return 'text-warn'
}

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  color: '#1e293b',
}
