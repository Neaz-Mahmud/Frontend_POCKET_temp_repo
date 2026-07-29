import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import { GraduationCap, LayoutDashboard } from 'lucide-react';
import './Public.css';

const homeFor = (role) =>
  role === 'admin' ? '/admin/dashboard'
  : role === 'teacher' ? '/teacher/personal'
  : '/student/personal';

const PublicLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="public-shell">
      <header className="public-topbar">
        <Link to="/central" className="public-brand">
          <span className="logo-mark"><GraduationCap size={18} /></span>
          Pocket University
        </Link>
        <nav className="public-nav">
          <NavLink to="/central" className={({ isActive }) => (isActive ? 'active' : '')}>Central Segment</NavLink>
          <NavLink to="/books" className={({ isActive }) => (isActive ? 'active' : '')}>Book Sharing</NavLink>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>Job Query</NavLink>
        </nav>
        <div className="public-actions">
          <ThemeToggle compact />
          {user ? (
            <Link to={homeFor(user.role)} className="btn btn-secondary btn-sm">
              <LayoutDashboard size={15} /> My Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" state={{ from: location.pathname }} className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </header>
      <main className="public-main">{children}</main>
    </div>
  );
};

export default PublicLayout;
