import { motion } from 'framer-motion'

// Big "you reached the finish line" celebration shown when a goal hits 100%.
export default function FinishOverlay({ goal, onClose }) {
  if (!goal) return null
  return (
    <div className="finish-backdrop" onClick={onClose}>
      <motion.div
        className="finish-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <div className="finish-emoji">🏁🎉</div>
        <h2>Finish line reached!</h2>
        <p>
          You completed <b>{goal.title}</b>. Every hard milestone is behind you — that’s the whole
          journey, done.
        </p>
        <button className="btn-primary" onClick={onClose}>Celebrate 🎊</button>
      </motion.div>
    </div>
  )
}
