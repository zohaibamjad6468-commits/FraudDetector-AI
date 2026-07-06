import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, FileText } from 'lucide-react'
import { RiskBadge } from '../components/RiskBadge'
import { useToast } from '../components/ToastProvider'
import api from '../services/api'

const ROWS_PER_PAGE = 10

export function HistoryPage() {
  const [transactions, setTransactions] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/transactions?page=${page}&per_page=${ROWS_PER_PAGE}`
      if (statusFilter !== 'All') {
        url += `&status=${statusFilter}`
      }
      const res = await api.get(url)
      setTransactions(res.data.data.transactions)
      setTotalPages(res.data.data.pages)
      setTotalItems(res.data.data.total)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/transactions/export/csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transactions_report.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      addToast('CSV report downloaded successfully!', 'success')
    } catch {
      addToast('Failed to export CSV. Please try again.', 'danger')
    }
  }

  const handleExportPDF = () => {
    const token = JSON.parse(localStorage.getItem('fg_auth_session'))?.accessToken
    const url = `${api.defaults.baseURL}/transactions/export/pdf`
    window.open(`${url}?token=${token}`, '_blank')
    addToast('PDF report opened in new tab. Use Ctrl+P to save as PDF.', 'info')
  }

  // Client side query filtering just for the current page to avoid building a complex search backend
  const filteredTransactions = transactions.filter(tx => {
    const normalized = query.trim().toLowerCase()
    return normalized.length === 0 || 
           tx.transactionRef.toLowerCase().includes(normalized) ||
           (tx.merchant && tx.merchant.toLowerCase().includes(normalized))
  })

  return (
    <section className="space-y-6">
      <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text">Transaction History</h2>
            <p className="mt-2 text-sm text-text-muted">
              Search, filter, and review transaction decisions with clear risk visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
            >
              <FileText size={15} />
              Export PDF
            </button>
          </div>
        </div>
      </motion.article>

      <article className="panel p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search current page by transaction ID or merchant"
              className="input py-2 pl-9 pr-3"
            />
          </label>
          <select
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            className="input w-auto px-3 py-2"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </article>

      <div className="panel overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-bg-alt text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Probability</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">Loading transactions...</td>
              </tr>
            ) : filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-bg-alt/70">
                <td className="px-4 py-3 font-medium text-text">{tx.transactionRef}</td>
                <td className="px-4 py-3 text-text-muted">{tx.merchant || 'Unknown'}</td>
                <td className="px-4 py-3 text-text-muted">{tx.merchantType || 'N/A'}</td>
                <td className="px-4 py-3 text-text">${tx.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StatusPill status={tx.status} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge level={tx.riskLevel} />
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {(tx.fraudProbability * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-text-muted">{new Date(tx.transactionTime).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                  No transactions match the current search and filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <article className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-muted">
          Showing {filteredTransactions.length} items from page {page} (Total items: {totalItems})
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="btn-secondary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-text-muted">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="btn-secondary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </article>
    </section>
  )
}

function StatusPill({ status }) {
  const statusStyles = {
    Approved: 'border-safe/50 bg-safe/12 text-safe',
    Blocked: 'border-risk/50 bg-risk/12 text-risk',
    Pending: 'border-warn/50 bg-warn/20 text-warn',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
        statusStyles[status] ?? statusStyles.Pending
      }`}
    >
      {status}
    </span>
  )
}
