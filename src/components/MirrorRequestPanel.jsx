import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Share2, Unlink } from 'lucide-react';
import { identityStyle } from '../utils/identityColor';

/**
 * Shown inside a section's course view (admin only). Lets the admin request
 * a teacher (by phone) to mirror one of their Share Material courses into
 * this course, and shows the live status: pending / approved-and-linked /
 * rejected, plus an unlink action once linked.
 */
const MirrorRequestPanel = ({ sectionId, courseId, onLinked }) => {
  const [status, setStatus] = useState(null); // { requests: [], link: {...} | null }
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const base = `/sections/${sectionId}/courses/${courseId}/mirror-requests`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(base);
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      await api.post(base, { phone: phone.trim() });
      setMessage({ type: 'success', text: 'Request sent — the teacher will see it in their Share Material inbox.' });
      setPhone('');
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not send request' });
    } finally {
      setSending(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Unlink this course? Files already mirrored here will stay, but new uploads from the teacher will stop showing up.')) return;
    try {
      await api.delete(`/sections/${sectionId}/courses/${courseId}/mirror-link`);
      load();
      onLinked?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not unlink');
    }
  };

  const handleDismissRequest = async (reqId) => {
    try {
      await api.delete(`${base}/${reqId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not dismiss request');
    }
  };

  if (loading) return null;

  const { requests = [], link } = status || {};
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="card mirror-panel">
      <h4 className="mirror-panel-title">
        <Share2 size={16} /> Mirror from a teacher
      </h4>

      {link ? (
        <div className="request-row mirror-panel-linked">
          <div className="member-avatar" style={identityStyle(link.teacher?._id || link.teacher?.name)}>{link.teacher?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div className="member-info">
            <div className="member-name">{link.teacher?.name}</div>
            <div className="member-sub">Linked — new uploads from them appear here automatically</div>
          </div>
          <div className="row-actions">
            <button className="btn btn-danger btn-sm" onClick={handleUnlink}>
              <Unlink size={14} /> Unlink
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-secondary mirror-panel-hint">
            Ask a teacher (by the phone number on their account) to mirror one of their courses here.
          </p>
          {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}
          <form onSubmit={handleRequest} className="invite-form">
            <label htmlFor="mirror-phone" className="sr-only">Teacher's phone number</label>
            <input
              id="mirror-phone"
              className="invite-form-target"
              placeholder="Teacher's phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send Request'}</button>
          </form>

          {pendingRequests.length > 0 && (
            <div className="mirror-panel-status">
              {pendingRequests.map((r) => (
                <div key={r._id} className="text-secondary mirror-panel-status-line">
                  Waiting on <b>{r.requestedTeacher?.name}</b> ({r.requestedTeacher?.phone})…
                </div>
              ))}
            </div>
          )}

          {rejectedRequests.length > 0 && (
            <div className="mirror-panel-status">
              {rejectedRequests.map((r) => (
                <div key={r._id} className="request-row">
                  <div className="member-info">
                    <div className="member-name text-danger">Rejected by {r.requestedTeacher?.name}</div>
                    <div className="member-sub">They declined your request for this course.</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDismissRequest(r._id)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MirrorRequestPanel;
