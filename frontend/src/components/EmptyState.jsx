export default function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <div className="empty-art">🏁</div>
      <h1>No goals yet</h1>
      <p>
        Pick something you want to acquire or achieve, break it into a roadmap, and watch yourself
        travel toward the finish line.
      </p>
      <button className="btn-primary" onClick={onCreate}>+ Create your first goal</button>
    </div>
  )
}
