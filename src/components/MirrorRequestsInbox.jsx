import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Check, X, FolderOpen } from 'lucide-react';
import { identityStyle } from '../utils/identityColor';
import '../styles/Panels.css';

/**
 * Lists pending MirrorRequests addressed to the logged-in teacher
 * ("<Section name> is asking for <Semester> - <Course>"). Rejecting is a
 * single click; approving requires picking one of the teacher's own
 * Share Material course folders to fulfill it with.
 */
const MirrorRequestsInbox = ({ onCountChange }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Which request is currently showing its "pick a course" picker
  const [pickingFor, setPickingFor] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [expandedSemester, setExpandedSemester] = useState(null);
  const [coursesBySemester, setCoursesBySemester] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teacher-materials/mirror-requests');
      setRequests(data);
      onCountChange?.(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReject = async (id) => {
    if (!window.confirm('Reject this request?')) return;
    setBusy(true);
    try {
      await api.patch(`/teacher-materials/mirror-requests/${id}/reject`);
      setMessage({ type: 'success', text: 'Request rejected' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const openPicker = async (request) => {
    setPickingFor(request._id);
    setExpandedSemester(null);
    setCoursesBySemester({});
    try {
      const { data } = await api.get('/teacher-materials/folders', { params: { parent: null } });
      setSemesters(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async (semesterId) => {
    setExpandedSemester(expandedSemester === semesterId ? null : semesterId);
    if (coursesBySemester[semesterId]) return;
    try {
      const { data } = await api.get('/teacher-materials/folders', { params: { parent: semesterId } });
      setCoursesBySemester((prev) => ({ ...prev, [semesterId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (requestId, courseFolderId) => {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await api.patch(`/teacher-materials/mirror-requests/${requestId}/approve`, {
        sourceFolderId: courseFolderId,
      });
      setMessage({
        type: 'success',
        text: `Linked — ${data.mirroredFileCount} existing file(s) mirrored over.`,
      });
      setPickingFor(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not approve request' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="loading-row"><span className="spinner" /> Loading…</div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">No pending requests right now.</div>
      ) : (
        <div className="row-list">
          {requests.map((r) => (
            <div key={r._id} className="card" style={{ padding: '1rem 1.1rem' }}>
              <div className="request-row" style={{ border: 'none', padding: 0, background: 'transparent' }}>
                <div className="member-avatar" style={identityStyle(r.section?._id || r.section?.name)}>{r.section?.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="member-info">
                  <div className="member-name">{r.section?.name}</div>
                  <div className="member-sub">
                    is asking for <b>{r.targetSemester?.name}</b> — <b>{r.targetCourse?.name}</b>
                  </div>
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={busy}
                    onClick={() => (pickingFor === r._id ? setPickingFor(null) : openPicker(r))}
                  >
                    <Check size={14} /> Mirror a course
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => handleReject(r._id)}>
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>

              {pickingFor === r._id && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--line)' }}>
                  <p className="text-secondary" style={{ marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                    Pick one of your Share Material courses to send here. Its current files will be mirrored right away,
                    and anything you upload to it later will show up here automatically.
                  </p>
                  {semesters.length === 0 ? (
                    <div className="empty-state">
                      You don't have any semesters in Share Material yet — create one first.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {semesters.map((sem) => (
                        <div key={sem._id}>
                          <button
                            className="filter-chip"
                            onClick={() => loadCourses(sem._id)}
                            style={{ marginBottom: '0.35rem' }}
                          >
                            <FolderOpen size={13} style={{ marginRight: '0.3rem' }} />
                            {sem.name}
                          </button>
                          {expandedSemester === sem._id && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '1rem', marginBottom: '0.4rem' }}>
                              {(coursesBySemester[sem._id] || []).length === 0 ? (
                                <span className="text-secondary" style={{ fontSize: '0.82rem' }}>No courses in this semester yet</span>
                              ) : (
                                coursesBySemester[sem._id].map((c) => (
                                  <button
                                    key={c._id}
                                    className="btn btn-primary btn-sm"
                                    disabled={busy}
                                    onClick={() => handleApprove(r._id, c._id)}
                                  >
                                    {c.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MirrorRequestsInbox;
