import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Check, X, Inbox, Trash2, Search } from 'lucide-react';
import '../../styles/Panels.css';
import './Admin.css';

const fmtSize = (bytes) => {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
};

const AdminSections = () => {
  const [view, setView] = useState('pending'); // 'pending' | 'all'
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/verifications/sections', { params: { status: 'pending' } });
      setPending(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load section verifications' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/sections', { params: { q } });
      setAll(data.sections);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load sections' });
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    if (view === 'pending') loadPending();
    else loadAll();
  }, [view, loadPending, loadAll]);

  const decide = async (id, action) => {
    let reason;
    if (action === 'reject') {
      reason = window.prompt('Reason for rejection (shown to the CR):', 'Section ID card is unclear.');
      if (reason === null) return;
    }
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/admin/verifications/sections/${id}/${action}`, action === 'reject' ? { reason } : {});
      setMessage({ type: 'success', text: action === 'approve' ? 'Section verified — 3 GB unlocked.' : 'Section verification rejected.' });
      setPending((r) => r.filter((s) => s._id !== id));
      window.dispatchEvent(new Event('refreshBadges'));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setBusyId(null);
    }
  };

  const removeSection = async (id, name) => {
    if (!window.confirm(`Delete section "${name}" and ALL its content? This cannot be undone.`)) return;
    setBusyId(id);
    setMessage(null);
    try {
      await api.delete(`/admin/sections/${id}`);
      setMessage({ type: 'success', text: 'Section deleted.' });
      setAll((r) => r.filter((s) => s._id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Sections</h2>
        <p className="text-secondary">Verify sections (unlocks 3 GB) and manage every section on the platform.</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="admin-tabs">
        <button className={`admin-tab${view === 'pending' ? ' active' : ''}`} onClick={() => setView('pending')}>Pending verification</button>
        <button className={`admin-tab${view === 'all' ? ' active' : ''}`} onClick={() => setView('all')}>All sections</button>
      </div>

      {view === 'all' && (
        <form className="admin-toolbar" onSubmit={(e) => { e.preventDefault(); loadAll(); }}>
          <input className="admin-search" placeholder="Search by name or join code…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-secondary btn-sm" type="submit"><Search size={15} /> Search</button>
        </form>
      )}

      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : view === 'pending' ? (
        pending.length === 0 ? (
          <div className="admin-empty"><Inbox size={40} /><p>No sections awaiting verification.</p></div>
        ) : (
          <div className="verify-list">
            {pending.map((s) => (
              <div key={s._id} className="card verify-card">
                <div className="verify-card-head">
                  <div>
                    <div className="verify-card-title">{s.name}</div>
                    <div className="verify-card-sub">Join code: {s.uniqueId} · CR: {s.verification?.submittedBy?.name || '—'} ({s.verification?.submittedBy?.phone || '—'})</div>
                  </div>
                </div>
                <div className="verify-docs">
                  {s.verificationDocs?.idCardUrl && (
                    <a className="verify-doc" href={s.verificationDocs.idCardUrl} target="_blank" rel="noreferrer">
                      <img src={s.verificationDocs.idCardUrl} alt="CR ID card" />
                      <span className="verify-doc-label">CR ID Card</span>
                    </a>
                  )}
                </div>
                <div className="verify-actions">
                  <button className="btn btn-primary btn-sm" disabled={busyId === s._id} onClick={() => decide(s._id, 'approve')}><Check size={15} /> Approve</button>
                  <button className="btn btn-secondary btn-sm" disabled={busyId === s._id} onClick={() => decide(s._id, 'reject')}><X size={15} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : all.length === 0 ? (
        <div className="admin-empty"><Inbox size={40} /><p>No sections found.</p></div>
      ) : (
        <div className="row-list">
          {all.map((s) => (
            <div key={s._id} className="member-row">
              <div className="member-info">
                <div className="member-name">{s.name} <span className={`admin-badge ${s.verification?.status || 'unverified'}`}>{s.verification?.status || 'unverified'}</span></div>
                <div className="member-sub">{s.uniqueId} · {fmtSize(s.storageUsed)} used</div>
              </div>
              <div className="row-actions">
                <button className="btn btn-ghost btn-sm text-danger" disabled={busyId === s._id} onClick={() => removeSection(s._id, s.name)} title="Delete section">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSections;
