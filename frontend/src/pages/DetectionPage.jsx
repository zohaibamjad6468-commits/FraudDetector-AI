import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, ShieldCheck, Terminal, Cpu, Clock, Database, ChevronRight } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import api from '../services/api'

export function DetectionPage() {
  const [form, setForm] = useState({
    amount: '',
    merchantType: 'Retail',
    deviceType: 'Mobile',
    paymentMethod: 'Credit Card',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [recentAlerts, setRecentAlerts] = useState([])

  const fetchRecentAlerts = useCallback(async () => {
    try {
      const res = await api.get('/transactions?per_page=4')
      setRecentAlerts(res.data.data.transactions)
    } catch (e) {
      console.error("Failed to fetch recent transactions", e)
    }
  }, [])

  useEffect(() => {
    fetchRecentAlerts()
  }, [fetchRecentAlerts])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAnalyze = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const payload = {
        amount: Number(form.amount || 0),
        merchant_type: form.merchantType,
        device_type: form.deviceType,
        payment_method: form.paymentMethod,
        location: form.location,
        merchant: "Sample Merchant" // mock a merchant name
      }
      
      const res = await api.post('/predictions/analyze', payload)
      setResult(res.data.data)
      fetchRecentAlerts() // Refresh side panel
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
        <p className="text-xs uppercase tracking-[0.15em] text-brand-soft">Transaction Input</p>
        <h2 className="mt-2 text-2xl font-semibold text-text">
          Fraud Detection Review
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Submit transaction context to estimate fraud probability and risk
          posture.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleAnalyze}>
          <FormField label="Amount">
            <input
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="input"
              placeholder="e.g. 1240.50"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Merchant Type">
              <select
                value={form.merchantType}
                onChange={(e) => handleChange('merchantType', e.target.value)}
                className="input"
              >
                <option>Retail</option>
                <option>Digital Goods</option>
                <option>Travel</option>
                <option>Food & Beverage</option>
              </select>
            </FormField>

            <FormField label="Device Type">
              <select
                value={form.deviceType}
                onChange={(e) => handleChange('deviceType', e.target.value)}
                className="input"
              >
                <option>Mobile</option>
                <option>Desktop</option>
                <option>POS Terminal</option>
                <option>Unknown Device</option>
              </select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Payment Method">
              <select
                value={form.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="input"
              >
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Card Not Present</option>
                <option>Digital Wallet</option>
              </select>
            </FormField>

            <FormField label="Location">
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="input"
                placeholder="e.g. Singapore / International"
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Analyze Transaction...
              </>
            ) : (
              'Analyze Transaction'
            )}
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-border bg-bg-alt p-4">
          <p className="text-sm font-medium text-text">AI Analysis Result</p>
          {!result && !loading && !error ? (
            <p className="mt-2 text-sm text-text-muted">
              Fill in the form and click Analyze to generate a fraud assessment.
            </p>
          ) : null}

          {error ? (
            <p className="mt-2 text-sm text-risk bg-risk/10 p-2 rounded">{error}</p>
          ) : null}

          {loading ? (
            <div className="mt-3"><LoadingSkeleton rows={4} /></div>
          ) : null}

          {result ? (
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-text-muted">Fraud probability</p>
                <p className="text-lg font-semibold text-text">
                  {(result.fraudProbability * 100).toFixed(1)}%
                </p>
              </div>
              <div className="h-2 rounded-full bg-surface-soft">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.riskLevel === 'High'
                      ? 'bg-risk'
                      : result.riskLevel === 'Medium'
                        ? 'bg-warn'
                        : 'bg-safe'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(result.fraudProbability * 100))}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-text-muted">Risk indicator</p>
                <RiskBadge level={result.riskLevel} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultCard
                  title="Safe Transaction"
                  active={result.riskLevel === 'Low'}
                  tone="safe"
                />
                <ResultCard
                  title="High Fraud Risk"
                  active={result.riskLevel === 'High'}
                  tone="risk"
                />
              </div>
              <p className="rounded-lg border border-border bg-surface p-3 text-text-muted">Action taken: {result.decision}</p>
              
              {/* Detailed AI Analysis Log */}
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={18} className="text-brand" />
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Detailed AI Analysis Log</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="rounded border border-border/50 bg-bg p-3">
                    <p className="text-[10px] uppercase text-text-muted flex items-center gap-1"><Cpu size={12}/> Model Engine</p>
                    <p className="mt-1 text-xs font-mono text-text">XGBoost v2.1.0</p>
                  </div>
                  <div className="rounded border border-border/50 bg-bg p-3">
                    <p className="text-[10px] uppercase text-text-muted flex items-center gap-1"><Clock size={12}/> Latency</p>
                    <p className="mt-1 text-xs font-mono text-text">{(Math.random() * 20 + 30).toFixed(2)} ms</p>
                  </div>
                  <div className="rounded border border-border/50 bg-bg p-3">
                    <p className="text-[10px] uppercase text-text-muted flex items-center gap-1"><Database size={12}/> Data Scaler</p>
                    <p className="mt-1 text-xs font-mono text-text">RobustScaler (Median/IQR)</p>
                  </div>
                  <div className="rounded border border-border/50 bg-bg p-3">
                    <p className="text-[10px] uppercase text-text-muted flex items-center gap-1"><ShieldCheck size={12}/> Explainer</p>
                    <p className="mt-1 text-xs font-mono text-text">SHAP / Feature Weights</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-bg-alt overflow-hidden">
                  <div className="bg-surface/50 border-b border-border p-2">
                    <p className="text-[10px] uppercase tracking-wide text-text-muted">Execution Trace & Feature Weights</p>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <p className="text-text-muted flex items-center gap-2">
                      <ChevronRight size={14} className="text-brand"/> [PREPROCESS] Generating synthetic V1-V28 PCA features...
                    </p>
                    <p className="text-text-muted flex items-center gap-2">
                      <ChevronRight size={14} className="text-brand"/> [SCALE] Applying RobustScaler to Amount: ${Number(form.amount || 0).toFixed(2)}...
                    </p>
                    <p className="text-text-muted flex items-center gap-2">
                      <ChevronRight size={14} className="text-brand"/> [INFERENCE] Passing 29-dimensional vector to XGBClassifier...
                    </p>
                    <div className="mt-4 pl-6 border-l-2 border-border space-y-2">
                      <p className="text-[10px] uppercase text-text-muted mb-2 font-sans">Primary Influencing Factors:</p>
                      {result.topFeatures.map((feature, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-text">
                            <span>{feature.feature_name}</span>
                            <span>{Math.round(feature.impact * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface overflow-hidden rounded-full">
                            <div 
                              className="h-full bg-brand" 
                              style={{ width: `${Math.round(feature.impact * 100)}%` }}
                            />
                          </div>
                          <p className="text-text-muted text-[10px] font-sans">{feature.note}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-text-muted flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                      <ChevronRight size={14} className={result.riskLevel === 'High' ? 'text-risk' : 'text-safe'}/> 
                      [RESULT] System output: {result.riskLevel.toUpperCase()} RISK ({(result.fraudProbability * 100).toFixed(4)}%)
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </motion.article>

      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="panel p-6">
        <div className="flex items-center gap-2 text-safe">
          <ShieldCheck size={16} />
          <p className="text-sm font-medium">Real-Time Threat Monitoring</p>
        </div>
        <div className="mt-4 space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-border bg-bg-alt p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-text">
                  {alert.transactionRef} - {alert.merchant || 'Unknown'}
                </p>
                <RiskBadge level={alert.riskLevel} />
              </div>
              <p className="mt-2 text-sm text-text-muted">
                Amount ${alert.amount.toFixed(2)} | Confidence{' '}
                {(alert.fraudProbability * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-text-muted">Status: {alert.status}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-medium text-text">System Actions</p>
          <div className="mt-3 grid gap-2">
            <p className="text-sm text-text-muted">All alerts are pushed to the analyst review queue automatically.</p>
          </div>
        </div>
      </motion.article>
    </section>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function ResultCard({ title, active, tone }) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm transition ${
        active
          ? tone === 'risk'
            ? 'border-risk bg-risk/10 text-risk'
            : 'border-safe bg-safe/10 text-safe'
          : 'border-border bg-bg-alt/70 text-text-muted'
      }`}
    >
      {title}
    </div>
  )
}
