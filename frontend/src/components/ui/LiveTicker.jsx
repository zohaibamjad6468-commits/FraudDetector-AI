import { motion } from 'framer-motion'

export function LiveTicker({ items }) {
  return (
    <div className="glass-panel overflow-hidden px-3 py-2">
      <motion.div
        className="flex gap-8 whitespace-nowrap text-xs text-cyan-100"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((item, idx) => (
          <span key={`${item}-${idx}`} className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
