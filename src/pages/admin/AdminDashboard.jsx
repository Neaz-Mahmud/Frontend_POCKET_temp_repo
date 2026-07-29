import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BadgeCheck, ShieldCheck, Users, GraduationCap, School } from 'lucide-react';
import '../../styles/Panels.css';
import './Admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load dashboard'));
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Admin';

  const cards = stats ? [
    { key: 'pendingUserVerifications', label: 'Pending ID verifications', value: stats.pendingUserVerifications, icon: <BadgeCheck size={20} />, to: '/admin/verifications', alert: stats.pendingUserVerifications > 0 },
    { key: 'pendingSectionVerifications', label: 'Pending section verifications', value: stats.pendingSectionVerifications, icon: <ShieldCheck size={20} />, to: '/admin/sections', alert: stats.pendingSectionVerifications > 0 },
    { key: 'totalStudents', label: 'Students', value: stats.totalStudents, icon: <GraduationCap size={20} />, to: '/admin/users' },
    { key: 'totalTeachers', label: 'Teachers', value: stats.totalTeachers, icon: <Users size={20} />, to: '/admin/users' },
    { key: 'totalSections', label: 'Sections', value: stats.totalSections, icon: <School size={20} />, to: '/admin/sections' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Welcome back, {firstName}</p>
        <h2>Admin Dashboard</h2>
        <p className="text-secondary">Approvals, members, and platform overview at a glance.</p>
      </div>

      {error && <div className="alert alert-block alert-error">{error}</div>}

      <div className="admin-stat-grid">
        {cards.map((c) => (
          <div
            key={c.key}
            className={`card admin-stat is-link${c.alert ? ' is-alert' : ''}`}
            onClick={() => navigate(c.to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(c.to); }}
          >
            <div className="admin-stat-top">
              <span className="admin-stat-icon">{c.icon}</span>
            </div>
            <div className="admin-stat-value">{c.value ?? '—'}</div>
            <div className="admin-stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
