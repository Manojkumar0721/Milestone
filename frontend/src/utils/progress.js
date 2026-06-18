// ---- task-aware progress -------------------------------------------------
// If a milestone has tasks, its completion is driven by them (done/total) and
// its status is derived. If it has no tasks, the user toggles status manually.

export function taskStats(m) {
  const total = m.tasks?.length || 0
  const done = m.tasks?.filter((t) => t.done).length || 0
  return { total, done }
}

export function effectiveStatus(m) {
  const { total, done } = taskStats(m)
  if (total > 0) {
    if (done === 0) return 'todo'
    if (done === total) return 'done'
    return 'active'
  }
  return m.status
}

// Full weight when done, partial when in progress -> drives marker distance.
export function milestoneFraction(m) {
  const { total, done } = taskStats(m)
  if (total > 0) return done / total
  if (m.status === 'done') return 1
  if (m.status === 'active') return 0.5
  return 0
}

export function goalProgress(goal) {
  const total = goal.milestones.reduce((sum, m) => sum + m.weight, 0)
  if (total === 0) return 0
  const earned = goal.milestones.reduce((sum, m) => sum + m.weight * milestoneFraction(m), 0)
  return earned / total
}

// Cumulative weight fraction at the end of each milestone -> stop placement.
export function milestoneStops(goal) {
  const total = goal.milestones.reduce((sum, m) => sum + m.weight, 0) || 1
  let acc = 0
  return goal.milestones.map((m) => {
    acc += m.weight
    return { ...m, frac: acc / total }
  })
}

export function nextMilestone(goal) {
  return (
    goal.milestones.find((m) => effectiveStatus(m) === 'active') ||
    goal.milestones.find((m) => effectiveStatus(m) === 'todo') ||
    null
  )
}

// ---- dates, pacing, relative time ----------------------------------------

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

// Are you ahead / on track / behind, comparing actual progress to how much
// of the timeline (created -> target) has elapsed.
export function pacing(goal) {
  const progress = goalProgress(goal)
  if (progress >= 1) return { state: 'done', progress, expected: 1 }
  if (!goal.createdAt || !goal.targetDate) return null
  const created = new Date(goal.createdAt)
  const target = new Date(goal.targetDate + 'T00:00:00')
  const now = new Date()
  const span = target - created
  if (span <= 0) return null
  const expected = Math.min(Math.max((now - created) / span, 0), 1)
  const delta = progress - expected
  let state = 'ontrack'
  if (delta < -0.1) state = 'behind'
  else if (delta > 0.1) state = 'ahead'
  return { state, expected, progress, delta }
}

export function relativeTime(iso) {
  if (!iso) return 'never'
  const then = new Date(iso)
  const diff = Date.now() - then.getTime()
  const sec = Math.round(diff / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  if (sec < 60) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 30) return `${day}d ago`
  return then.toLocaleDateString()
}

// Days with at least one logged event, counting back from today.
export function activeStreak(events) {
  if (!events || events.length === 0) return 0
  const days = new Set(events.map((e) => new Date(e.ts).toDateString()))
  let streak = 0
  const cursor = new Date()
  // allow today OR yesterday to start the streak
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toDateString())) return 0
  }
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
