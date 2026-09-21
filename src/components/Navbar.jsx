import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">✔ TaskFlow</span>
        <nav>
          <NavLink to="/" end>Projects</NavLink>
          <NavLink to="/my-tasks">My Tasks</NavLink>
        </nav>
        <div className="navbar-user">
          <span>{user.name}</span>
          <button className="btn btn-small btn-ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
