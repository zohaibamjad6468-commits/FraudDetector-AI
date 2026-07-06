export function RiskBadge({ level }) {
  const styles = {
    High: 'border-risk/45 bg-risk/12 text-risk',
    Fraud: 'border-risk/45 bg-risk/12 text-risk',
    Medium: 'border-warn/45 bg-warn/12 text-warn',
    Suspicious: 'border-warn/45 bg-warn/12 text-warn',
    Low: 'border-safe/45 bg-safe/12 text-safe',
    Safe: 'border-safe/45 bg-safe/12 text-safe',
  }

  const labelMap = {
    High: 'Fraud',
    Medium: 'Suspicious',
    Low: 'Safe',
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[level] ?? styles.Low
      }`}
    >
      {labelMap[level] ?? level}
    </span>
  )
}
