import { useState } from 'react'
import { DIFFICULTY } from '../data/mockData'
import { effectiveStatus, taskStats } from '../utils/progress'

export default function MilestonePanel({
  goal,
  selectedId,
  onSelect,
  onCycleStatus,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onMoveMilestone,
}) {
  const [edit, setEdit] = useState(false)

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="panel-title">Roadmap</h3>
        <button className="link-btn" onClick={() => setEdit((v) => !v)}>
          {edit ? 'Done editing' : 'Edit roadmap'}
        </button>
      </div>

      {goal.milestones.length === 0 && (
        <p className="history-empty">No milestones yet. Add the first step below.</p>
      )}

      <ul className="ms-list">
        {goal.milestones.map((m, i) => {
          const status = effectiveStatus(m)
          const open = m.id === selectedId
          const { total, done } = taskStats(m)
          return (
            <li key={m.id} className={`ms-item ms-${status} ${open ? 'open' : ''}`}>
              <div className="ms-head">
                <button className="ms-head-main" onClick={() => onSelect(open ? null : m.id)}>
                  <span className={`ms-dot dot-${status}`}>{status === 'done' ? '✓' : i + 1}</span>
                  <span className="ms-name">{m.title}</span>
                  <span className="ms-weight" title="Difficulty / effort">{'★'.repeat(m.weight)}</span>
                </button>
                {edit && (
                  <span className="ms-reorder">
                    <button disabled={i === 0} onClick={() => onMoveMilestone(m.id, -1)} title="Move up">↑</button>
                    <button
                      disabled={i === goal.milestones.length - 1}
                      onClick={() => onMoveMilestone(m.id, 1)}
                      title="Move down"
                    >↓</button>
                  </span>
                )}
              </div>

              {open && (
                <div className="ms-body">
                  {total > 0 && (
                    <div className="ms-task-progress">{done}/{total} tasks done</div>
                  )}

                  <ul className="task-list">
                    {m.tasks.map((t) => (
                      <li key={t.id}>
                        <label>
                          <input type="checkbox" checked={t.done} onChange={() => onToggleTask(m.id, t.id)} />
                          <span className={t.done ? 'task-done' : ''}>{t.title}</span>
                        </label>
                        {edit && (
                          <button className="x-btn" onClick={() => onDeleteTask(m.id, t.id)} title="Delete task">×</button>
                        )}
                      </li>
                    ))}
                  </ul>

                  <AddTask onAdd={(title) => onAddTask(m.id, title)} />

                  {total === 0 && (
                    <button className="ms-action" onClick={() => onCycleStatus(m.id)}>
                      {status === 'done' ? 'Reset' : status === 'active' ? 'Mark complete' : 'Start this'}
                    </button>
                  )}

                  {edit && (
                    <EditMilestone
                      milestone={m}
                      onSave={(patch) => onEditMilestone(m.id, patch)}
                      onDelete={() => onDeleteMilestone(m.id)}
                    />
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {edit && <AddMilestone onAdd={onAddMilestone} />}

      <p className="panel-hint">
        Tip: each milestone's <b>★</b> is its difficulty. Harder milestones push the marker further
        along the trail. Milestones with tasks complete automatically as you check them off.
      </p>
      <Legend />
    </div>
  )
}

function AddTask({ onAdd }) {
  const [val, setVal] = useState('')
  return (
    <form
      className="inline-add"
      onSubmit={(e) => {
        e.preventDefault()
        if (val.trim()) {
          onAdd(val.trim())
          setVal('')
        }
      }}
    >
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="+ Add a task" />
      {val.trim() && <button type="submit">Add</button>}
    </form>
  )
}

function AddMilestone({ onAdd }) {
  const [title, setTitle] = useState('')
  const [weight, setWeight] = useState(3)
  return (
    <form
      className="add-ms"
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) {
          onAdd(title.trim(), Number(weight))
          setTitle('')
          setWeight(3)
        }
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ New milestone" />
      <select value={weight} onChange={(e) => setWeight(e.target.value)} title="Difficulty">
        {[1, 2, 3, 4, 5].map((w) => (
          <option key={w} value={w}>{'★'.repeat(w)}</option>
        ))}
      </select>
      <button type="submit" className="btn-primary" disabled={!title.trim()}>Add</button>
    </form>
  )
}

function EditMilestone({ milestone, onSave, onDelete }) {
  const [title, setTitle] = useState(milestone.title)
  const [weight, setWeight] = useState(milestone.weight)
  const changed = title.trim() !== milestone.title || Number(weight) !== milestone.weight
  return (
    <div className="edit-ms">
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <select value={weight} onChange={(e) => setWeight(e.target.value)}>
        {[1, 2, 3, 4, 5].map((w) => (
          <option key={w} value={w}>{'★'.repeat(w)}</option>
        ))}
      </select>
      <button
        className="btn-mini"
        disabled={!changed || !title.trim()}
        onClick={() => onSave({ title: title.trim(), weight: Number(weight) })}
      >Save</button>
      <button className="btn-mini danger" onClick={onDelete}>Delete</button>
    </div>
  )
}

function Legend() {
  return (
    <div className="legend">
      {Object.entries(DIFFICULTY).map(([k, v]) => (
        <span key={k} className="legend-item">
          <i style={{ background: v.color }} /> {v.label}
        </span>
      ))}
    </div>
  )
}
