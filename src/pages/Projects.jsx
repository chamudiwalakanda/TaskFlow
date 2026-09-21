import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setProjects((await api.get('/projects')).data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <h1>Your projects</h1>
      {error && <div className="alert">{error}</div>}

      <form className="card inline-form" onSubmit={create}>
        <input placeholder="New project name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn" type="submit">+ Create</button>
      </form>

      {loading ? <p className="muted">Loading…</p> : projects.length === 0 ? (
        <p className="muted">No projects yet. Create your first one above.</p>
      ) : (
        <div className="grid">
          {projects.map((p) => {
            const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
                <h3>{p.name}</h3>
                <p className="muted">{p.description || 'No description'}</p>
                <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                <small className="muted">{p.done_count}/{p.task_count} tasks done · owner: {p.owner_name}</small>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
