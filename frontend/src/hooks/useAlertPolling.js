import { useEffect, useRef, useCallback } from 'react'
import { useToast } from '../components/ToastProvider'
import { useAuth } from '../auth/AuthContext'
import api from '../services/api'

const POLL_INTERVAL_MS = 30000 // 30 seconds

/**
 * Custom hook that polls the review queue every 30 seconds.
 * When new high-risk cases are detected, it fires a toast notification.
 */
export function useAlertPolling() {
  const { addToast } = useToast()
  const { isAuthenticated } = useAuth()
  const prevCountRef = useRef(null)
  const intervalRef = useRef(null)

  const checkForNewAlerts = useCallback(async () => {
    try {
      const res = await api.get('/cases/queue')
      const cases = res.data?.data?.cases || []
      const currentCount = cases.length

      // On first load, just store the count (don't show toast)
      if (prevCountRef.current === null) {
        prevCountRef.current = currentCount
        return
      }

      // If new cases appeared since last check
      if (currentCount > prevCountRef.current) {
        const newCount = currentCount - prevCountRef.current
        const highRiskCases = cases.filter(c => c.priority === 'High')

        if (highRiskCases.length > 0) {
          addToast(
            `🚨 ${newCount} new high-risk transaction${newCount > 1 ? 's' : ''} detected! Check the Review Queue.`,
            'danger',
            7000
          )
        } else {
          addToast(
            `📋 ${newCount} new transaction${newCount > 1 ? 's' : ''} added to Review Queue.`,
            'warning',
            5000
          )
        }
      }

      prevCountRef.current = currentCount
    } catch {
      // Silently ignore polling errors
    }
  }, [addToast])

  useEffect(() => {
    if (!isAuthenticated) return

    // Initial check
    checkForNewAlerts()

    // Start polling
    intervalRef.current = setInterval(checkForNewAlerts, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, checkForNewAlerts])
}
