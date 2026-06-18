import { motion } from 'framer-motion'

const COLORS = ['#6366f1', '#f472b6', '#fbbf24', '#34d399', '#60a5fa']

// Lightweight one-shot confetti burst — no extra dependency.
export default function Confetti({ show }) {
  if (!show) return null
  const pieces = Array.from({ length: 80 })
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => {
        const left = (i * 37) % 100
        const delay = (i % 10) * 0.04
        const drift = ((i * 53) % 120) - 60
        const color = COLORS[i % COLORS.length]
        return (
          <motion.span
            key={i}
            className="confetti-piece"
            style={{ left: `${left}%`, background: color }}
            initial={{ y: -40, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', x: drift, opacity: 0, rotate: 540 }}
            transition={{ duration: 1.8 + (i % 5) * 0.2, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}
