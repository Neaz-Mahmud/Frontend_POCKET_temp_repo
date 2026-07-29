import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Check, X, Inbox } from 'lucide-react';
import '../../styles/Panels.css';
import './Admin.css';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

const AdminVerifications = () => {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/verifications/users', { params: { status: tab } });
      setRows(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load verifications' });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/admin/verifications/users/${id}/approve`);
      setMessage({ type: 'success', text: 'Verification approved — storage upgraded.' });
      setRows((r) => r.filter((u) => u._id !== id));
      window.dispatchEvent(new Event('refreshBadges'));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Approve failed' });
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (shown to the user):', 'ID card is unclear or does not match the profile.');
    if (reason === null) return;
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/admin/verifications/users/${id}/reject`, { reason });
      setMessage({ type: 'success', text: 'Verification rejected — the user can resubmit.' });
      setRows((r) => r.filter((u) => u._id !== id));
      window.dispatchEvent(new Event('refreshBadges'));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Reject failed' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Student &amp; Teacher IDs</h2>
        <p className="text-secondary">Review submitted ID cards. Approving unlocks the higher storage tier.</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          <Inbox size={40} />
          <p>No {tab} verifications.</p>
        </div>
      ) : (
        <div className="verify-list">
          {rows.map((u) => (
            <div key={u._id} className="card verify-card">
              <div className="verify-card-head">
                <div>
                  <div className="verify-card-title">{u.name}</div>
                  <div className="verify-card-sub">{u.email} · {u.phone}</div>
                </div>
                <span className={`admin-badge role-${u.role}`}>{u.role}</span>
              </div>

              {u.role === 'student' && (
                <div className="verify-meta-grid">
                  <div className="verify-meta-item"><span className="verify-meta-key">University</span><span className="verify-meta-val">{u.university || '—'}</span></div>
                  <div className="verify-meta-item"><span className="verify-meta-key">Section</span><span className="verify-meta-val">{u.sectionName || '—'}</span></div>
                  <div className="verify-meta-item"><span className="verify-meta-key">Batch</span><span className="verify-meta-val">{u.batch || '—'}</span></div>
                  <div className="verify-meta-item"><span className="verify-meta-key">Student ID</span><span className="verify-meta-val">{u.studentId || '—'}</span></div>
                </div>
              )}

              <div className="verify-docs">
                {u.verificationDocs?.idCardUrl && (
                  <a className="verify-doc" href={u.verificationDocs.idCardUrl} target="_blank" rel="noreferrer">
                    <img src={u.verificationDocs.idCardUrl} alt="ID card" />
                    <span className="verify-doc-label">ID Card</span>
                  </a>
                )}
                {u.verificationDocs?.nidUrl && (
                  <a className="verify-doc" href={u.verificationDocs.nidUrl} target="_blank" rel="noreferrer">
                    <img src={u.verificationDocs.nidUrl} alt="NID" />
                    <span className="verify-doc-label">NID</span>
                  </a>
                )}
              </div>

              {u.verification?.rejectionReason && tab === 'rejected' && (
                <p className="text-danger" style={{ fontSize: 'var(--text-sm)' }}>Reason: {u.verification.rejectionReason}</p>
              )}

              {tab === 'pending' && (
                <div className="verify-actions">
                  <button className="btn btn-primary btn-sm" disabled={busyId === u._id} onClick={() => approve(u._id)}>
                    <Check size={15} /> Approve
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={busyId === u._id} onClick={() => reject(u._id)}>
                    <X size={15} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
