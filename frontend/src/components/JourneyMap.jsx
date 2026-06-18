import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { buildSerpentinePath } from '../utils/serpentine'
import { milestoneStops, goalProgress, effectiveStatus } from '../utils/progress'
import { DIFFICULTY } from '../data/mockData'

const truncate = (s, n = 22) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

const W = 420
const PAD_X = 70
const PAD_Y = 90

// Midpoint (by weight fraction) of a milestone's segment, so its node sits in
// the middle of the stretch of trail it represents.
function midFrac(stops, i) {
  const prev = i === 0 ? 0 : stops[i - 1].frac
  return (prev + stops[i].frac) / 2
}

export default function JourneyMap({ goal, selectedMilestoneId, onSelectMilestone }) {
  const stops = milestoneStops(goal)
  const progress = goalProgress(goal)

  // Taller path when there are more milestones so the trail never feels cramped.
  const H = Math.max(620, 180 + stops.length * 150)
  const d = buildSerpentinePath(stops.length + 1, W, H, PAD_X, PAD_Y)

  const pathRef = useRef(null)
  // Geometry is measured from the rendered path in a layout effect and stored
  // in state (never read the ref during render).
  const [geo, setGeo] = useState(null)

  const stopsKey = stops.map((s) => s.frac.toFixed(4)).join(',')

  useLayoutEffect(() => {
    const path = pathRef.current
    if (!path) return
    const L = path.getTotalLength()
    const at = (f) => {
      const p = path.getPointAtLength(Math.min(Math.max(f, 0), 1) * L)
      return { x: p.x, y: p.y }
    }
    setGeo({
      L,
      start: at(0),
      finish: at(1),
      marker: at(progress),
      nodes: stops.map((m, i) => ({ id: m.id, ...at(midFrac(stops, i)) })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, progress, stopsKey])

  const diff = DIFFICULTY[goal.difficulty]
  const nodeXById = geo ? Object.fromEntries(geo.nodes.map((n) => [n.id, n])) : {}

  return (
    <div className="journey-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="journey-svg" role="img" aria-label="Goal journey map">
        <defs>
          <linearGradient id="trail" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor={diff.color} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* faint full trail */}
        <path ref={pathRef} d={d} className="trail-bg" fill="none" />

        {geo && (
          <>
            {/* completed portion, drawn up to current progress */}
            <motion.path
              d={d}
              className="trail-done"
              fill="none"
              stroke="url(#trail)"
              strokeDasharray={geo.L}
              initial={false}
              animate={{ strokeDashoffset: geo.L * (1 - progress) }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            />

            {/* START flag */}
            <g transform={`translate(${geo.start.x}, ${geo.start.y})`}>
              <circle r="14" className="endcap" />
              <text className="endcap-label" y="34" textAnchor="middle">START</text>
            </g>

            {/* milestone stops */}
            {stops.map((m, i) => {
              const node = nodeXById[m.id]
              if (!node) return null
              const status = effectiveStatus(m)
              const isSel = m.id === selectedMilestoneId
              const cls = `node node-${status}${isSel ? ' node-sel' : ''}`
              return (
                <g
                  key={m.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="node-g"
                  role="button"
                  tabIndex={0}
                  aria-label={`Milestone ${i + 1}: ${m.title} (${status})`}
                  onClick={() => onSelectMilestone(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectMilestone(m.id)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="20" className={cls} filter={status === 'active' ? 'url(#glow)' : undefined} />
                  <text className="node-num" textAnchor="middle" dy="5">
                    {status === 'done' ? '✓' : i + 1}
                  </text>
                  <text className={`node-label ${node.x < W / 2 ? 'lbl-right' : 'lbl-left'}`} dy="5">
                    {truncate(m.title)}
                  </text>
                </g>
              )
            })}

            {/* FINISH flag */}
            <g transform={`translate(${geo.finish.x}, ${geo.finish.y})`}>
              <circle r="16" className={`finish ${progress >= 1 ? 'finish-reached' : ''}`} />
              <text className="finish-flag" textAnchor="middle" dy="6">🏁</text>
              <text className="endcap-label" y="-26" textAnchor="middle">FINISH</text>
            </g>

            {/* the traveller marker */}
            <motion.g
              initial={false}
              animate={{ x: geo.marker.x, y: geo.marker.y }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            >
              <circle r="13" className="marker-pulse" />
              <circle r="9" className="marker" />
            </motion.g>
          </>
        )}
      </svg>
    </div>
  )
}
