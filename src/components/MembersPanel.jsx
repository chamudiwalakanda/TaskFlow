import { useState } from 'react';
import api, { errorMessage } from '../api';

export default function MembersPanel({ projectId, members, isOwner, ownerId, onChange }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email });
      setEmail('');
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from this project?`)) return;
    try {
      await api.delete(`/projects/${projectId}/members/${m.id}`);
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="card">
      <h3>Team ({members.length})</h3>
      {error && <div className="alert">{error}</div>}
      <ul className="members">
        {members.map((m) => (
          <li key={m.id}>
            <span>{m.name} <small className="muted">{m.email}</small>{m.id === ownerId && ' 👑'}</span>
            {isOwner && m.id !== ownerId && (
              <button className="btn btn-small btn-danger" onClick={() => remove(m)}>Remove</button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form className="inline-form" onSubmit={add}>
          <input type="email" required placeholder="Teammate's email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-small" type="submit">Add</button>
        </form>
      )}
    </div>
  );
}
