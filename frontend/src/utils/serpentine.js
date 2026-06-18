// Builds a smooth winding ("serpentine") SVG path from bottom to top.
// We render the path, then place stops on it by path-length fraction using
// the browser's getPointAtLength — so node placement always sits on the trail.

export function buildSerpentinePath(curves, width, height, padX, padY) {
  const n = Math.max(2, curves) // number of anchor points
  const usableH = height - 2 * padY
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const y = height - padY - t * usableH // start at bottom, finish at top
    const x = i % 2 === 0 ? padX : width - padX
    pts.push({ x, y })
  }
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < n; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const cy = (p0.y + p1.y) / 2
    // mirror control points across the midpoint y -> smooth S-curves
    d += ` C ${p0.x} ${cy}, ${p1.x} ${cy}, ${p1.x} ${p1.y}`
  }
  return d
}
