import { useState } from 'react';

// Used for both creating and editing a task.
export default function TaskModal({ task, members, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{task ? 'Edit task' : 'New task'}</h2>
        <label>Title
          <input required autoFocus value={form.title} onChange={set('title')} />
        </label>
        <label>Description
          <textarea rows={3} value={form.description} onChange={set('description')} />
        </label>
        <div className="row">
          <label>Status
            <select value={form.status} onChange={set('status')}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label>Assign to
            <select value={form.assigned_to} onChange={set('assigned_to')}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>Due date
            <input type="date" value={form.due_date || ''} onChange={set('due_date')} />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn">Save</button>
        </div>
      </form>
    </div>
  );
}
