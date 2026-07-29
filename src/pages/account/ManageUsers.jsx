import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import api from '../../api/axios';
import { identityStyle } from '../../utils/identityColor';
import '../../styles/Panels.css';

const ROLE_BADGE = { admin: 'badge-ink', teacher: 'badge-sky', student: 'badge-mint' };

const ManageUsers = ({ sectionId }) => {
  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState({});
  const [requests, setRequests] = useState([]);
  const [roleFilter, setRoleFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [invite, setInvite] = useState({ email: '', role: 'student' });
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, requestsRes] = await Promise.all([
        api.get(`/sections/${sectionId}/members`, { params: roleFilter ? { role: roleFilter } : {} }),
        api.get(`/sections/${sectionId}/join-requests`),
      ]);
      setMembers(membersRes.data.members || []);
      const countMap = {};
      (membersRes.data.counts || []).forEach((c) => { countMap[c._id] = c.count; });
      setCounts(countMap);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sectionId, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDecide = async (reqId, decision) => {
    try {
      await api.patch(`/sections/${sectionId}/join-requests/${reqId}`, { decision });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleRemove = async (userId, isCancel) => {
    const msg = isCancel ? 'Cancel this invitation?' : 'Remove this member from the Section?';
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/sections/${sectionId}/members/${userId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove member');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setMessage(null);
    try {
      const payload = invite.email.includes('@') ? { email: invite.email, role: invite.role } : { phone: invite.email, role: invite.role };
      const { data } = await api.post(`/sections/${sectionId}/invite`, payload);
      setMessage({ type: 'success', text: `Invite sent to ${data.targetUser?.name || 'user'}` });
      setInvite({ email: '', role: 'student' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invite failed' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="stat-row">
        <span className="stat-chip"><b>{counts.admin || 0}</b>Admins</span>
        <span className="stat-chip"><b>{counts.teacher || 0}</b>Teachers</span>
        <span className="stat-chip"><b>{counts.student || 0}</b>Students</span>
      </div>

      <div className="card invite-card">
        <h4 className="invite-card-title">Invite a member</h4>
        <p className="text-secondary invite-card-hint">
          Works only for people who already have an account (search by email or phone).
        </p>
        {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}
        <form onSubmit={handleInvite} className="invite-form">
          <label htmlFor="invite-target" className="sr-only">Email or phone</label>
          <input
            id="invite-target"
            className="invite-form-target"
            placeholder="Email or phone"
            value={invite.email}
            onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            required
          />
          <label htmlFor="invite-role" className="sr-only">Role</label>
          <select id="invite-role" className="invite-form-role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={inviting}>
            {inviting ? 'Inviting…' : 'Invite'}</button>
        </form>
      </div>

      {requests.length > 0 && (
        <>
          <h4 className="request-heading">Pending Requests ({requests.length})</h4>
          <div className="row-list request-list">
            {requests.map((r) => (
              <div key={r._id} className="request-row">
                <div className="member-avatar" style={identityStyle(r.user?._id || r.user?.name)}>{r.user?.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="member-info">
                  <div className="member-name">{r.user?.name}</div>
                  <div className="member-sub">{r.user?.email} · wants to join as <b>{r.role}</b></div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDecide(r._id, 'approve')}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDecide(r._id, 'reject')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="filter-row">
        {[null, 'admin', 'teacher', 'student'].map((r) => (
          <button key={r || 'all'} className={`filter-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
            {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton-list">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><Users size={22} /></span>
          <span className="empty-state-title">No members here yet</span>
          <span className="empty-state-hint">Invite students and teachers using the field above, or share your Section's join code.</span>
        </div>
      ) : (
        <div className="row-list">
          {members.map((m) => (
            <div key={m._id} className="member-row">
              <div className="member-avatar" style={identityStyle(m.user?._id || m.user?.name)}>{m.user?.name?.charAt(0).toUpperCase() || '?'}</div>
              <div className="member-info">
                <div className="member-name">{m.user?.name}</div>
                <div className="member-sub">{m.user?.email}</div>
              </div>
              <div className="member-role-badges">
                <span className={`badge ${ROLE_BADGE[m.role]}`}>{m.role}</span>
                {m.status === 'invited' && <span className="badge badge-muted">Invited</span>}
              </div>
              <div className="row-actions">
                {m.status === 'invited' ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleRemove(m.user._id, true)}>Cancel Invite</button>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m.user._id, false)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
