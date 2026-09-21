export default function TaskCard({ task, onEdit, onDelete, onMove }) {
  const overdue = task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10);
  return (
    <div className="card task-card">
      <div className="task-top">
        <strong>{task.title}</strong>
        <span className={`badge p-${task.priority}`}>{task.priority}</span>
      </div>
      {task.description && <p className="muted">{task.description}</p>}
      <div className="task-meta">
        <span>👤 {task.assignee_name || 'Unassigned'}</span>
        {task.due_date && <span className={overdue ? 'overdue' : ''}>📅 {task.due_date}</span>}
      </div>
      <div className="task-actions">
        {task.status !== 'todo' && (
          <button className="btn btn-small btn-ghost" onClick={() => onMove(task, task.status === 'done' ? 'in_progress' : 'todo')}>← Back</button>
        )}
        {task.status !== 'done' && (
          <button className="btn btn-small" onClick={() => onMove(task, task.status === 'todo' ? 'in_progress' : 'done')}>Next →</button>
        )}
        <button className="btn btn-small btn-ghost" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn btn-small btn-danger" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  );
}
