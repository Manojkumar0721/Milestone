import { relativeTime, activeStreak, pacing } from '../utils/progress'

const PACE = {
  ahead: { label: 'Ahead of schedule', cls: 'pace-ahead', icon: '🚀' },
  ontrack: { label: 'On track', cls: 'pace-ontrack', icon: '👍' },
  behind: { label: 'Behind schedule', cls: 'pace-behind', icon: '⏰' },
  done: { label: 'Goal complete', cls: 'pace-done', icon: '🏆' },
}

export default function HistoryLog({ goal }) {
  const events = [...(goal.events || [])].sort((a, b) => new Date(b.ts) - new Date(a.ts))
  const streak = activeStreak(events)
  const pace = pacing(goal)
  const lastActive = events[0]?.ts

  return (
    <div className="panel history-panel">
      <h3 className="panel-title">Momentum</h3>

      <div className="momentum-row">
        {pace && (
          <span className={`pace-chip ${PACE[pace.state].cls}`}>
            {PACE[pace.state].icon} {PACE[pace.state].label}
          </span>
        )}
        {streak > 0 && <span className="streak-chip">🔥 {streak}-day streak</span>}
        <span className="last-active">Last activity: {relativeTime(lastActive)}</span>
      </div>

      <h4 className="history-subtitle">Progress history</h4>
      {events.length === 0 ? (
        <p className="history-empty">No activity yet — complete a task to start your timeline.</p>
      ) : (
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.id} className="timeline-item">
              <span className="timeline-dot" />
              <div>
                <div className="timeline-text">{e.text}</div>
                <div className="timeline-time">{relativeTime(e.ts)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
