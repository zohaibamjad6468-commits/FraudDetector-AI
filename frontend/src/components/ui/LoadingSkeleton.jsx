export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-3 animate-pulse rounded bg-surface-soft"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  )
}
