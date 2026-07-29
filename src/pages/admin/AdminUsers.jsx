import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Search, ShieldPlus, Inbox } from 'lucide-react';
import { identityStyle } from '../../utils/identityColor';
import '../../styles/Panels.css';
import './Admin.css';

const ROLE_FILTERS = ['all', 'student', 'teacher', 'admin'];

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const [grantEmail, setGrantEmail] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q, page };
      if (role !== 'all') params.role = role;
      const { data } = await api.get('/admin/users', { params });
      setRows(data.users);
      setPages(data.pages || 1);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => { load(); }, [load]);

  const removeUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all their files? This cannot be undone.`)) return;
    setBusyId(id);
    setMessage(null);
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage({ type: 'success', text: 'User deleted.' });
      setRows((r) => r.filter((u) => u._id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
    } finally {
      setBusyId(null);
    }
  };

  const grantAdmin = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post('/admin/admins', { email: grantEmail.trim() });
      setMessage({ type: 'success', text: `${grantEmail} is now an admin.` });
      setGrantEmail('');
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not grant admin' });
    }
  };

  const vStatus = (u) => (u.role === 'admin' ? 'verified' : u.verification?.status || 'unverified');

  return (
    <div>
      <div className="page-header">
        <h2>Users</h2>
        <p className="text-secondary">Every account on the platform. Search, review, or remove.</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="card invite-card">
        <h4 className="invite-card-title">Grant admin access</h4>
        <p className="invite-card-hint text-secondary">Promote an existing user to platform admin by email.</p>
        <form className="invite-form" onSubmit={grantAdmin}>
          <input className="invite-form-target" type="email" required placeholder="person@example.com" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
          <button className="btn btn-primary" type="submit"><ShieldPlus size={15} /> Grant admin</button>
        </form>
      </div>

      <form className="admin-toolbar" onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}>
        <input className="admin-search" placeholder="Search name, email, or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-secondary btn-sm" type="submit"><Search size={15} /> Search</button>
      </form>

      <div className="filter-row">
        {ROLE_FILTERS.map((r) => (
          <button key={r} type="button" className={`filter-chip${role === r ? ' active' : ''}`} onClick={() => { setRole(r); setPage(1); }}>
            {r === 'all' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="admin-empty"><Inbox size={40} /><p>No users found.</p></div>
      ) : (
        <div className="row-list">
          {rows.map((u) => (
            <div key={u._id} className="member-row">
              <div className="member-avatar" style={identityStyle(u._id || u.name)}>{u.name?.charAt(0).toUpperCase() || '?'}</div>
              <div className="member-info">
                <div className="member-name">
                  {u.name}
                  <span className={`admin-badge role-${u.role}`} style={{ marginLeft: 8 }}>{u.role}</span>
                  <span className={`admin-badge ${vStatus(u)}`} style={{ marginLeft: 6 }}>{vStatus(u)}</span>
                </div>
                <div className="member-sub">{u.email} · {u.phone}{u.role === 'student' && u.university ? ` · ${u.university}` : ''}</div>
              </div>
              <div className="row-actions">
                {u._id !== me?._id && (
                  <button className="btn btn-ghost btn-sm text-danger" disabled={busyId === u._id} onClick={() => removeUser(u._id, u.name)} title="Delete user">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pager">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-secondary">Page {page} of {pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
