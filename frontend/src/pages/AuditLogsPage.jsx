import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Download } from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import api from '../services/api'

export function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const handleExportCSV = () => {
    if (logs.length === 0) {
      addToast('No logs to export.', 'warning')
      return
    }
    const headers = ['Log ID', 'Actor', 'Role', 'Action', 'Target Type', 'Target ID', 'Timestamp']
    const rows = logs.map(l => [
      l.id, l.actor, l.actorRole, l.action, l.targetType, l.targetId,
      new Date(l.createdAt).toLocaleString()
    ])
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'audit_logs_report.csv'
    link.click()
    window.URL.revokeObjectURL(url)
    addToast('Audit logs CSV downloaded!', 'success')
  }

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/audit/logs?per_page=50')
        setLogs(res.data.data.logs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <section className="space-y-5">
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-brand-soft">
              Compliance Trail
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Audit Logs</h2>
            <p className="mt-1 text-sm text-text-muted">
              Analyst activity history for fraud decision accountability.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </motion.article>

      <article className="panel overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-3">
          <Activity size={16} className="text-brand-soft" />
          <p className="text-sm font-medium text-text">Action Logs</p>
        </div>
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-bg-alt text-text-muted">
            <tr>
              <th className="px-4 py-3">Log ID</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">Loading audit logs...</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-bg-alt/60">
                <td className="px-4 py-3 text-text">{log.id}</td>
                <td className="px-4 py-3 text-text-muted">{log.actor}</td>
                <td className="px-4 py-3 text-text-muted">{log.actorRole}</td>
                <td className="px-4 py-3 text-text">{log.action}</td>
                <td className="px-4 py-3 text-text-muted">{log.targetType} ({log.targetId})</td>
                <td className="px-4 py-3 text-text-muted">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  )
}
