import { useEffect, useRef, useState } from 'react'
import './App.css'
import { DIFFICULTY } from './data/mockData'
import { goalProgress, nextMilestone, daysUntil } from './utils/progress'
import { api } from './api/client'
import { useAuth } from './auth/AuthContext'
import { useMediaQuery } from './hooks/useMediaQuery'
import Brand from './components/Brand'
import NavIcon from './components/NavIcons'
import AuthPage from './components/AuthPage'
import JourneyMap from './components/JourneyMap'
import MilestonePanel from './components/MilestonePanel'
import HistoryLog from './components/HistoryLog'
import GoalForm from './components/GoalForm'
import EmptyState from './components/EmptyState'
import FinishOverlay from './components/FinishOverlay'
import Confetti from './components/Confetti'
import InstallApp from './components/InstallApp'
import AppIcon from './components/AppIcons'

const STATUS_FLOW = { todo: 'active', active: 'done', done: 'todo' }

// Auth gate: a splash while the saved session is restored, then login/register
// until signed in, then the dashboard (keyed by user so state resets on switch).
export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <AuthPage />
  return <Dashboard key={user.id} user={user} />
}

function Dashboard({ user }) {
  const { logout } = useAuth()
  const [goals, setGoals] = useState([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [apiError, setApiError] = useState('')
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [selectedMs, setSelectedMs] = useState(null)
  const [celebrate, setCelebrate] = useState(false)
  const [finishGoal, setFinishGoal] = useState(null)
  const [form, setForm] = useState(null) // 'create' | 'edit' | null
  const [mobileTab, setMobileTab] = useState('journey')
  // Offer to install the app on first sign-in per device — unless it's already
  // installed (standalone) or the prompt was dismissed before.
  const [showInstall, setShowInstall] = useState(() => {
    if (localStorage.getItem('milestone.installSeen')) return false
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    return !standalone
  })
  const isMobile = useMediaQuery('(max-width: 880px)')

  const goal = goals.find((g) => g.id === activeGoalId) || goals[0]
  const progress = goal ? goalProgress(goal) : 0
  const prevById = useRef({})

  function flashError(msg) {
    setApiError(msg)
    setTimeout(() => setApiError(''), 4000)
  }

  // Load this user's goals from the API on mount.
  useEffect(() => {
    let alive = true
    api('/goals')
      .then((data) => {
        if (!alive) return
        setGoals(data)
        setActiveGoalId((prev) => prev ?? data[0]?.id ?? null)
      })
      .catch((e) => alive && flashError(e.message))
      .finally(() => alive && setLoadingGoals(false))
    return () => {
      alive = false
    }
  }, [])

  // Celebrate on any forward progress; full overlay when the finish line is reached.
  useEffect(() => {
    if (!goal) return
    const prev = prevById.current[goal.id] ?? progress
    if (progress > prev) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 2200)
      if (progress >= 1 && prev < 1) setFinishGoal(goal)
      prevById.current[goal.id] = progress
      return () => clearTimeout(t)
    }
    prevById.current[goal.id] = progress
  }, [progress, goal])

  const closeInstall = () => {
    setShowInstall(false)
    localStorage.setItem('milestone.installSeen', '1')
  }

  // Run an API mutation, surfacing any error as a transient banner.
  async function call(fn) {
    try {
      await fn()
    } catch (e) {
      flashError(e.message)
    }
  }

  // Every mutation endpoint returns the full updated goal — just swap it in.
  const replaceGoal = (updated) =>
    setGoals((gs) => gs.map((g) => (g.id === updated.id ? updated : g)))

  // ---- task handlers ----
  const toggleTask = (milestoneId, taskId) =>
    call(async () => {
      const m = goal.milestones.find((x) => x.id === milestoneId)
      const t = m?.tasks.find((x) => x.id === taskId)
      if (!t) return
      replaceGoal(await api(`/tasks/${taskId}`, { method: 'PUT', body: { done: !t.done } }))
    })

  const addTask = (milestoneId, title) =>
    call(async () =>
      replaceGoal(await api(`/milestones/${milestoneId}/tasks`, { method: 'POST', body: { title } })),
    )

  const deleteTask = (_milestoneId, taskId) =>
    call(async () => replaceGoal(await api(`/tasks/${taskId}`, { method: 'DELETE' })))

  // ---- milestone handlers ----
  const cycleStatus = (milestoneId) =>
    call(async () => {
      const m = goal.milestones.find((x) => x.id === milestoneId)
      if (!m) return
      const status = STATUS_FLOW[m.status]
      replaceGoal(await api(`/milestones/${milestoneId}`, { method: 'PUT', body: { status } }))
    })

  const addMilestone = (title, weight) =>
    call(async () =>
      replaceGoal(
        await api(`/goals/${goal.id}/milestones`, { method: 'POST', body: { title, weight } }),
      ),
    )

  const editMilestone = (milestoneId, patch) =>
    call(async () => replaceGoal(await api(`/milestones/${milestoneId}`, { method: 'PUT', body: patch })))

  const deleteMilestone = (milestoneId) =>
    call(async () => {
      replaceGoal(await api(`/milestones/${milestoneId}`, { method: 'DELETE' }))
      if (selectedMs === milestoneId) setSelectedMs(null)
    })

  const moveMilestone = (milestoneId, dir) =>
    call(async () =>
      replaceGoal(await api(`/milestones/${milestoneId}/move?dir=${dir}`, { method: 'PUT' })),
    )

  // ---- goal handlers ----
  const createGoal = (data) =>
    call(async () => {
      const g = await api('/goals', { method: 'POST', body: data })
      setGoals((gs) => [...gs, g])
      setActiveGoalId(g.id)
      setSelectedMs(null)
      setForm(null)
    })

  const saveGoalEdit = (data) =>
    call(async () => {
      replaceGoal(await api(`/goals/${goal.id}`, { method: 'PUT', body: data }))
      setForm(null)
    })

  const deleteGoal = () =>
    call(async () => {
      await api(`/goals/${goal.id}`, { method: 'DELETE' })
      const remaining = goals.filter((g) => g.id !== goal.id)
      setGoals(remaining)
      setActiveGoalId(remaining[0]?.id ?? null)
      setSelectedMs(null)
    })

  // ---- loading ----
  if (loadingGoals) return <Splash />

  // ---- empty state ----
  if (!goal) {
    return (
      <div className="app">
        {apiError && <div className="api-error-banner">{apiError}</div>}
        <div className="topbar topbar-split">
          <Brand />
          <div className="topbar-actions">
            <button className="link-btn link-btn-icon" onClick={() => setShowInstall(true)}>
              <AppIcon name="download" size={15} /> Get the app
            </button>
            <button className="link-btn" onClick={logout}>Sign out</button>
          </div>
        </div>
        <EmptyState onCreate={() => setForm('create')} />
        {form && <GoalForm onSave={createGoal} onCancel={() => setForm(null)} />}
        {showInstall && <InstallApp onClose={closeInstall} />}
      </div>
    )
  }

  const next = nextMilestone(goal)
  const days = daysUntil(goal.targetDate)
  const diff = DIFFICULTY[goal.difficulty]
  const daysValue = days > 0 ? days : days === null ? '—' : 'Past due'

  // ---- mobile layout: bottom tabs, one section at a time ----
  if (isMobile) {
    const initials = (user.name || user.email || '?')
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    const TABS = [
      { key: 'journey', label: 'Journey' },
      { key: 'roadmap', label: 'Roadmap' },
      { key: 'momentum', label: 'Momentum' },
      { key: 'goals', label: 'Goals' },
    ]
    return (
      <div className="m-app">
        {apiError && <div className="api-error-banner">{apiError}</div>}
        <Confetti show={celebrate} />
        <FinishOverlay goal={finishGoal} onClose={() => setFinishGoal(null)} />

        <header className="m-topbar">
          <button className="m-goal-switch" onClick={() => setMobileTab('goals')}>
            <span className="m-goal-title">{goal.title}</span>
            <span className="m-goal-sub">{Math.round(progress * 100)}% · tap to switch</span>
          </button>
          <span className="diff-badge" style={{ background: diff.color }}>{diff.label}</span>
        </header>

        <main className="m-main">
          {mobileTab === 'journey' && (
            <>
              <div className="goal-head m-goal-head">
                <h1>{goal.title}</h1>
                <p className="why">“{goal.why}”</p>
                <div className="goal-head-actions">
                  <button className="link-btn" onClick={() => setForm('edit')}>Edit</button>
                  <button className="link-btn danger" onClick={deleteGoal}>Delete</button>
                </div>
              </div>
              <div className="stats">
                <Stat label="Progress" value={`${Math.round(progress * 100)}%`} />
                <Stat label="Days left" value={daysValue} />
                <Stat label="Next up" value={progress >= 1 ? 'Done! 🎉' : next ? next.title : '—'} wide />
              </div>
              <JourneyMap goal={goal} selectedMilestoneId={selectedMs} onSelectMilestone={setSelectedMs} />
            </>
          )}

          {mobileTab === 'roadmap' && (
            <MilestonePanel
              goal={goal}
              selectedId={selectedMs}
              onSelect={setSelectedMs}
              onCycleStatus={cycleStatus}
              onToggleTask={toggleTask}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onAddMilestone={addMilestone}
              onEditMilestone={editMilestone}
              onDeleteMilestone={deleteMilestone}
              onMoveMilestone={moveMilestone}
            />
          )}

          {mobileTab === 'momentum' && <HistoryLog goal={goal} />}

          {mobileTab === 'goals' && (
            <div className="m-goals">
              <div className="brand-block m-brand"><Brand /></div>
              <div className="sidebar-label">Your goals</div>
              <nav className="goal-nav m-goal-nav">
                {goals.map((g) => {
                  const p = Math.round(goalProgress(g) * 100)
                  return (
                    <button
                      key={g.id}
                      className={`goal-nav-item ${g.id === goal.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveGoalId(g.id)
                        setSelectedMs(null)
                        setMobileTab('journey')
                      }}
                    >
                      <span className="gn-row">
                        <span className="gn-title">{g.title}</span>
                        <span className="gn-pct">{p}%</span>
                      </span>
                      <span className="gn-bar"><i style={{ width: `${p}%` }} /></span>
                    </button>
                  )
                })}
              </nav>
              <button className="btn-primary new-goal-btn" onClick={() => setForm('create')}>
                + New goal
              </button>
              <button className="install-link m-install" onClick={() => setShowInstall(true)}>
                <AppIcon name="download" size={16} /> Get the app
              </button>
              <div className="user-box">
                <span className="user-avatar">{initials}</span>
                <span className="user-meta">
                  <span className="user-name">{user.name || 'You'}</span>
                  <span className="user-email">{user.email}</span>
                </span>
                <button className="link-btn" onClick={logout}>Sign out</button>
              </div>
            </div>
          )}
        </main>

        <nav className="m-tabbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`m-tab ${mobileTab === t.key ? 'active' : ''}`}
              onClick={() => setMobileTab(t.key)}
            >
              <span className="m-tab-icon"><NavIcon name={t.key} /></span>
              <span className="m-tab-label">{t.label}</span>
            </button>
          ))}
        </nav>

        {form === 'create' && <GoalForm onSave={createGoal} onCancel={() => setForm(null)} />}
        {form === 'edit' && (
          <GoalForm initial={goal} onSave={saveGoalEdit} onCancel={() => setForm(null)} />
        )}
        {showInstall && <InstallApp onClose={closeInstall} />}
      </div>
    )
  }

  return (
    <div className="app-shell">
      {apiError && <div className="api-error-banner">{apiError}</div>}
      <Confetti show={celebrate} />
      <FinishOverlay goal={finishGoal} onClose={() => setFinishGoal(null)} />

      <GoalSidebar
        goals={goals}
        activeId={goal.id}
        user={user}
        onLogout={logout}
        onSelect={(id) => {
          setActiveGoalId(id)
          setSelectedMs(null)
        }}
        onNew={() => setForm('create')}
        onGetApp={() => setShowInstall(true)}
      />

      <div className="content">
        <main className="layout">
          <section className="map-col">
            <div className="goal-head">
              <div>
                <h1>{goal.title}</h1>
                <p className="why">“{goal.why}”</p>
              </div>
              <div className="goal-head-actions">
                <span className="diff-badge" style={{ background: diff.color }}>{diff.label}</span>
                <button className="link-btn" onClick={() => setForm('edit')}>Edit</button>
                <button className="link-btn danger" onClick={deleteGoal}>Delete</button>
              </div>
            </div>

            <div className="stats">
              <Stat label="Progress" value={`${Math.round(progress * 100)}%`} />
              <Stat label="Days left" value={days > 0 ? days : days === null ? '—' : 'Past due'} />
              <Stat label="Next up" value={progress >= 1 ? 'Done! 🎉' : next ? next.title : '—'} wide />
            </div>

            <JourneyMap goal={goal} selectedMilestoneId={selectedMs} onSelectMilestone={setSelectedMs} />
          </section>

          <aside className="panel-col">
            <MilestonePanel
              goal={goal}
              selectedId={selectedMs}
              onSelect={setSelectedMs}
              onCycleStatus={cycleStatus}
              onToggleTask={toggleTask}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onAddMilestone={addMilestone}
              onEditMilestone={editMilestone}
              onDeleteMilestone={deleteMilestone}
              onMoveMilestone={moveMilestone}
            />
            <HistoryLog goal={goal} />
          </aside>
        </main>

        <footer className="foot">
          <strong>Milestone</strong> — every big goal is just a series of small steps. Keep moving
          toward your finish line. 🏁
        </footer>
      </div>

      {form === 'create' && <GoalForm onSave={createGoal} onCancel={() => setForm(null)} />}
      {form === 'edit' && (
        <GoalForm initial={goal} onSave={saveGoalEdit} onCancel={() => setForm(null)} />
      )}
      {showInstall && <InstallApp onClose={closeInstall} />}
    </div>
  )
}


function GoalSidebar({ goals, activeId, user, onLogout, onSelect, onNew, onGetApp }) {
  const initials = (user.name || user.email || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-label">Your goals</div>
      <nav className="goal-nav">
        {goals.map((g) => {
          const p = Math.round(goalProgress(g) * 100)
          return (
            <button
              key={g.id}
              className={`goal-nav-item ${g.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(g.id)}
            >
              <span className="gn-row">
                <span className="gn-title">{g.title}</span>
                <span className="gn-pct">{p}%</span>
              </span>
              <span className="gn-bar"><i style={{ width: `${p}%` }} /></span>
            </button>
          )
        })}
      </nav>
      <button className="btn-primary new-goal-btn" onClick={onNew}>+ New goal</button>
      <button className="install-link" onClick={onGetApp}>
        <AppIcon name="download" size={16} /> Get the app
      </button>

      <div className="user-box">
        <span className="user-avatar">{initials}</span>
        <span className="user-meta">
          <span className="user-name">{user.name || 'You'}</span>
          <span className="user-email">{user.email}</span>
        </span>
        <button className="link-btn" onClick={onLogout} title="Sign out">Sign out</button>
      </div>
    </aside>
  )
}

function Stat({ label, value, wide }) {
  return (
    <div className={`stat ${wide ? 'stat-wide' : ''}`}>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )
}

function Splash() {
  return (
    <div className="splash">
      <Brand size={48} />
      <div className="splash-dot" />
    </div>
  )
}
