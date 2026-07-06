import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000    // 15 minutes
const WARNING_BEFORE_MS = 60 * 1000        // Show warning 1 minute before logout
const TRACKED_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

/**
 * Custom hook that tracks user activity and auto-logs out after 15 minutes of inactivity.
 * Shows a warning 1 minute before the session expires.
 * 
 * @returns {{ showWarning: boolean, remainingSeconds: number }}
 */
export function useIdleTimeout() {
  const { logout, isAuthenticated } = useAuth()
  const timerRef = useRef(null)
  const warningTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(60)

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const handleLogout = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    logout()
  }, [logout, clearAllTimers])

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return

    clearAllTimers()
    setShowWarning(false)
    setRemainingSeconds(60)

    // Set warning timer (fires 1 minute before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      setRemainingSeconds(60)

      // Start countdown
      let seconds = 60
      countdownRef.current = setInterval(() => {
        seconds -= 1
        setRemainingSeconds(seconds)
        if (seconds <= 0) {
          clearInterval(countdownRef.current)
        }
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)

    // Set logout timer
    timerRef.current = setTimeout(() => {
      handleLogout()
    }, IDLE_TIMEOUT_MS)
  }, [isAuthenticated, handleLogout, clearAllTimers])

  useEffect(() => {
    if (!isAuthenticated) return

    // Initial timer setup
    resetTimer()

    // Attach activity listeners
    const handleActivity = () => resetTimer()
    TRACKED_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearAllTimers()
      TRACKED_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, resetTimer, clearAllTimers])

  return { showWarning, remainingSeconds }
}
