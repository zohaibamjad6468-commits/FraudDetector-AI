import { motion } from 'framer-motion'

export function PageHeader({ eyebrow, title, subtitle, rightSlot }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="panel flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold text-text md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>
      {rightSlot}
    </motion.header>
  )
}
