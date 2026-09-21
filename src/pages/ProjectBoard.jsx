import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import MembersPanel from '../components/MembersPanel';

const COLUMNS = [
  { key: 'todo', title: 'To do' },
  { key: 'in_progress', title: 'In progress' },
  { key: 'done', title: 'Done' },
];

export default function ProjectBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ q: '', priority: '', assigned_to: '' });
  const [modal, setModal] = useState(null); // null | 'new' | task object
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      setTasks((await api.get(`/projects/${id}/tasks`, { params })).data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id, filters]);

  const loadMembers = useCallback(async () => {
    setMembers((await api.get(`/projects/${id}/members`)).data);
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setProject((await api.get(`/projects/${id}`)).data);
        await loadMembers();
      } catch (err) {
        setError(errorMessage(err));
      }
    })();
  }, [id, loadMembers]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const saveTask = async (data) => {
    try {
      if (modal === 'new') await api.post(`/projects/${id}/tasks`, data);
      else await api.put(`/tasks/${modal.id}`, data);
      setModal(null);
      loadTasks();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const moveTask = async (task, status) => {
    await api.put(`/tasks/${task.id}`, { status });
    loadTasks();
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api.delete(`/tasks/${task.id}`);
    loadTasks();
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and ALL its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!project) return error ? <div className="alert">{error}</div> : <p className="muted">Loading…</p>;
  const isOwner = project.owner_id === user.id;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">{project.description}</p>
        </div>
        <div>
          <button className="btn" onClick={() => setModal('new')}>+ New task</button>{' '}
          {isOwner && <button className="btn btn-danger" onClick={deleteProject}>Delete project</button>}
        </div>
      </div>

      {error && <div className="alert" onClick={() => setError('')}>{error}</div>}

      <MembersPanel projectId={id} members={members} isOwner={isOwner} ownerId={project.owner_id} onChange={loadMembers} />

      <div className="filters">
        <input placeholder="Search tasks…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}>
          <option value="">Everyone</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <section key={col.key} className="column">
              <h3>{col.title} <span className="count">{items.length}</span></h3>
              {items.map((t) => (
                <TaskCard key={t.id} task={t} onEdit={setModal} onDelete={deleteTask} onMove={moveTask} />
              ))}
            </section>
          );
        })}
      </div>

      {modal && (
        <TaskModal task={modal === 'new' ? null : modal} members={members} onSave={saveTask} onClose={() => setModal(null)} />
      )}
    </>
  );
}
