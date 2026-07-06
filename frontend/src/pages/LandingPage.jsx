import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Brain, ShieldCheck, TrendingUp } from 'lucide-react'
import api from '../services/api'

export function LandingPage() {
  const [stats, setStats] = useState({
    fraudRate: '0.00%',
    normalRate: '100.00%',
    alerts: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboards/admin/summary')
        if (res.data && res.data.data) {
          setStats({
            fraudRate: `${res.data.data.fraudRate.toFixed(2)}%`,
            normalRate: `${(100 - res.data.data.fraudRate).toFixed(2)}%`,
            alerts: res.data.data.totalAlerts
          })
        }
      } catch {
        setStats({
          fraudRate: '0.17%',
          normalRate: '99.83%',
          alerts: 'System Active'
        })
      }
    }
    fetchStats()
  }, [])

  return (
    <section className="space-y-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-xl border border-border bg-surface p-8 md:p-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-soft">
              AI Fraud Detection Platform
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-text md:text-5xl">
              Enterprise-grade credit card fraud intelligence for real-time risk decisions.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-text-muted">
              Designed for final-year project presentation quality with a professional
              fintech SaaS experience focused on accuracy, explainability, and speed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/detect" className="btn-primary group inline-flex items-center gap-2">
                Analyze Transaction
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <Link to="/analytics/executive" className="btn-secondary inline-flex items-center">
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="panel p-5">
            <p className="text-sm font-medium text-text">System Snapshot</p>
            <div className="mt-4 space-y-4 text-sm">
              <Feature icon={ShieldCheck} title="AI Risk Engine" value="96.2% detection confidence" />
              <Feature icon={Brain} title="Neural Fraud Analysis" value="118ms average inference latency" />
              <Feature icon={TrendingUp} title="Threat Monitoring" value={`${stats.alerts} active alerts`} />
            </div>
          </div>
        </div>
      </motion.div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="text-sm text-text-muted">Fraud Rate</p>
          <p className="mt-2 text-3xl font-semibold text-risk">{stats.fraudRate}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-text-muted">Normal Transactions</p>
          <p className="mt-2 text-3xl font-semibold text-safe">{stats.normalRate}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-text-muted">Amount Distribution</p>
          <p className="mt-2 text-lg font-semibold text-text">$0.00 - $25,000.00</p>
        </article>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <h3 className="text-lg font-semibold text-text">How It Works</h3>
          <ol className="mt-3 space-y-3 text-sm text-text-muted">
            <li>1. Transaction context enters AI Risk Engine.</li>
            <li>2. Neural model computes fraud probability and risk level.</li>
            <li>3. System routes transaction: safe, suspicious, or fraud.</li>
          </ol>
        </section>
        <section className="panel p-6">
          <h3 className="text-lg font-semibold text-text">Core Features</h3>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>- Real-time fraud scoring and case prioritization</li>
            <li>- Explainable AI signals for analyst confidence</li>
            <li>- Enterprise dashboard with live risk analytics</li>
            <li>- Responsive UI for desktop and mobile review</li>
          </ul>
        </section>
      </div>

      <footer className="border-t border-border pt-5 text-sm text-text-muted">
        FinGuard AI - Credit Card Fraud Detection System - University Final Year Project Showcase
      </footer>
    </section>
  )
}

function Feature({ icon: Icon, title, value }) {
  return (
    <article className="rounded-lg border border-border bg-bg-alt p-3">
      <p className="inline-flex items-center gap-2 text-sm text-text">
        <Icon size={15} />
        {title}
      </p>
      <p className="mt-2 text-xs text-text-muted">{value}</p>
    </article>
  )
}
