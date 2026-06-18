import { useState } from 'react'
import { DIFFICULTY } from '../data/mockData'

// Modal for creating a new goal or editing an existing one's details.
export default function GoalForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [why, setWhy] = useState(initial?.why || '')
  const [targetDate, setTargetDate] = useState(initial?.targetDate || '')
  const [difficulty, setDifficulty] = useState(initial?.difficulty || 'medium')
  const editing = Boolean(initial)

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), why: why.trim(), targetDate, difficulty })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{editing ? 'Edit goal' : 'Create a goal'}</h2>

        <label className="field">
          <span>What do you want to achieve?</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Buy my first home"
          />
        </label>

        <label className="field">
          <span>Why does it matter? (your motivation)</span>
          <textarea
            value={why}
            rows={2}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="The reason that will keep you going…"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Target date</span>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {Object.entries(DIFFICULTY).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#121a33', color: '#e7ecf5' }}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!title.trim()}>
            {editing ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </form>
    </div>
  )
}
