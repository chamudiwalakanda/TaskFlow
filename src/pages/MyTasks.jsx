import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tasks/mine').then((r) => setTasks(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <>
      <h1>My tasks</h1>
      {error && <div className="alert">{error}</div>}
      {tasks.length === 0 && <p className="muted">Nothing assigned to you. 🎉</p>}
      <div className="list">
        {tasks.map((t) => (
          <div key={t.id} className="card task-row">
            <div>
              <strong>{t.title}</strong>
              <div className="muted">
                <Link to={`/projects/${t.project_id}`}>{t.project_name}</Link>
                {t.due_date && ` · due ${t.due_date}`}
              </div>
            </div>
            <div>
              <span className={`badge p-${t.priority}`}>{t.priority}</span>{' '}
              <span className="badge">{t.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
