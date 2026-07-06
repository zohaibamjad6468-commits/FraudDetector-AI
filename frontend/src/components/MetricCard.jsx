export function MetricCard({ label, value, trend, tone = 'neutral' }) {
  const toneClass = {
    positive: 'text-safe',
    warning: 'text-warn',
    danger: 'text-risk',
    neutral: 'text-text-muted',
  }

  return (
    <article className="panel p-4">
      <p className="text-sm text-text-muted/90">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-text">{value}</p>
      {trend ? (
        <p className={`mt-1 text-xs ${toneClass[tone] ?? toneClass.neutral}`}>
          {trend}
        </p>
      ) : null}
    </article>
  )
}
