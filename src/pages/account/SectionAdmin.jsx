import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ManageUsers from './ManageUsers';
import PostNotice from './PostNotice';
import UploadMaterial from './UploadMaterial';
import { ArrowLeft, Users, Bell, BookOpen, Copy, Check, Edit2, X, Save, ShieldCheck, Upload, Clock } from 'lucide-react';
import { identityStyle } from '../../utils/identityColor';
import '../../styles/Panels.css';
import './MySections.css';
import './Profile.css';

const CR_TOOLS = [
  { key: 'members', label: 'Members', icon: Users },
  { key: 'notices', label: 'Notices', icon: Bell },
  { key: 'materials', label: 'Materials', icon: BookOpen },
];
const TOOL_KEYS = CR_TOOLS.map((t) => t.key);

/**
 * A section's own dedicated admin page — reached via /student/sections/:id
 * or /teacher/sections/:id. Replaces the old inline accordion so a CR gets
 * full room to work with Members / Notices / Materials, with the tool
 * choice reflected in the URL (?tool=) so it's shareable/refreshable.
 */
const SectionAdmin = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // If we arrived via the "My Sections" list, the card already had this
  // section's data — use it for an instant first paint instead of a
  // loading spinner, then quietly re-verify with the server below.
  const preloaded = location.state?.section?._id === sectionId ? location.state.section : null;

  const [section, setSection] = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', uniqueId: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // Section verification (CR uploads their student ID card to unlock 3 GB)
  const [verifyDoc, setVerifyDoc] = useState(null); // { file, preview }
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  // The route pattern is the same for every section (/sections/:sectionId),
  // so navigating from one section's admin page straight to another's
  // (e.g. via browser back/forward across two visited sections) does NOT
  // unmount/remount this component — sectionId just changes on the same
  // instance. Without this, `section` would keep showing the previous
  // section's stale data/tools until the background verify resolved.
  useEffect(() => {
    setSection(preloaded);
    setLoading(!preloaded);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  // Active tool lives in the URL (?tool=notices) so a specific tab is
  // shareable and survives a refresh, instead of resetting to Members.
  const toolParam = searchParams.get('tool');
  const activeTool = TOOL_KEYS.includes(toolParam) ? toolParam : 'members';
  const setActiveTool = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tool', key);
      return next;
    }, { replace: true });
  };

  const basePath = user?.role === 'teacher' ? '/teacher/sections' : '/student/sections';

  const load = useCallback(async () => {
    // Only show the full-page spinner if we don't already have preloaded
    // data to render — otherwise this re-check happens quietly.
    if (!preloaded) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/sections/my');
      const found = data.find((s) => s._id === sectionId);
      if (!found) {
        setError('not-found');
      } else if (found.memberRole !== 'admin') {
        setError('not-admin');
      } else {
        setSection(found);
      }
    } catch (err) {
      console.error(err);
      // If we have preloaded data and only the background refresh failed,
      // don't wipe out a perfectly usable page over a transient network blip.
      if (!preloaded) setError('load-failed');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  useEffect(() => { load(); }, [load]);

  const handleCopyCode = () => {
    if (!section) return;
    navigator.clipboard.writeText(section.uniqueId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const startEdit = () => {
    setEditData({ name: section.name, uniqueId: section.uniqueId });
    setEditError('');
    setIsEditing(true);
  };

  const saveEdit = async () => {
    setEditError('');
    setSaving(true);
    try {
      const { data } = await api.patch(`/sections/${sectionId}`, editData);
      setSection(data);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  const submitSectionVerification = async (e) => {
    e.preventDefault();
    if (!verifyDoc) { setVerifyMsg({ type: 'error', text: 'Please choose your student ID card image' }); return; }
    setVerifySubmitting(true);
    setVerifyMsg(null);
    try {
      const { data: pre } = await api.post(`/sections/${sectionId}/verification/presign`, { mimeType: verifyDoc.file.type });
      await axios.put(pre.presignedUrl, verifyDoc.file, { headers: { 'Content-Type': verifyDoc.file.type } });
      const { data: updated } = await api.post(`/sections/${sectionId}/verification`, { idCardKey: pre.fileKey });
      setSection((s) => ({ ...s, ...updated }));
      setVerifyDoc(null);
      setVerifyMsg({ type: 'success', text: 'Submitted! An admin will review your section verification.' });
    } catch (err) {
      setVerifyMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally {
      setVerifySubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-row"><span className="spinner" /> Loading section…</div>;
  }

  if (error === 'not-found') {
    return (
      <div className="empty-state">
        This section isn't in your list.{' '}
        <Link to={basePath}>Go back to My Sections</Link>
      </div>
    );
  }

  if (error === 'not-admin') {
    return (
      <div className="empty-state">
        You're not an admin of this section, so there's nothing to manage here.{' '}
        <Link to={basePath}>Go back to My Sections</Link>
      </div>
    );
  }

  if (error === 'load-failed' || !section) {
    return <div className="empty-state">Couldn't load this section. Please try again.</div>;
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm section-admin-back" onClick={() => navigate(basePath)}>
        <ArrowLeft size={15} /> My Sections
      </button>

      <div className="page-header section-admin-header">
        {isEditing ? (
          <div className="section-admin-edit">
            {editError && <div className="alert alert-error">{editError}</div>}
            <input
              type="text"
              value={editData.name}
              onChange={e => setEditData({...editData, name: e.target.value})}
              placeholder="Section Name"
            />
            <input
              type="text"
              value={editData.uniqueId}
              onChange={e => setEditData({...editData, uniqueId: e.target.value})}
              placeholder="Unique ID"
            />
            <div className="section-admin-edit-actions">
              <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)} disabled={saving}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="section-admin-identity">
            <div className="member-avatar section-admin-avatar" style={identityStyle(section._id)}>
              {section.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="section-admin-title-row">
                <h2>{section.name}</h2>
                <button className="btn btn-ghost btn-sm" onClick={startEdit} title="Edit Section">
                  <Edit2 size={16} />
                </button>
              </div>
              <button className="section-admin-code" onClick={handleCopyCode} title="Copy join code">
                {section.uniqueId} {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}
        <span className="badge badge-ink section-admin-badge">admin</span>
      </div>

      {(() => {
        const vs = section.verification?.status || 'unverified';
        const daysLeft = section.deletionDueAt ? Math.max(0, Math.ceil((new Date(section.deletionDueAt) - Date.now()) / (24 * 3600 * 1000))) : null;
        const canSubmit = vs === 'unverified' || vs === 'rejected';
        return (
          <div className="card verify-block section-verify-card">
            <div className="verify-block-head">
              <h3><ShieldCheck size={18} /> Section verification</h3>
              <span className={`verify-status-badge ${vs}`}>{vs}</span>
            </div>
            <div className="verify-tier">
              <span className="verify-tier-item">Unverified: <b>100 MB</b></span>
              <span className="verify-tier-item">Verified: <b>3 GB</b></span>
            </div>
            {verifyMsg && <div className={`alert alert-block alert-${verifyMsg.type}`}>{verifyMsg.text}</div>}
            {vs === 'verified' && <p className="text-secondary">This section is verified — 3 GB unlocked.</p>}
            {vs === 'pending' && <p className="text-secondary">Verification submitted. Awaiting admin review.</p>}
            {canSubmit && (
              <>
                {daysLeft !== null && (
                  <div className="verify-warning">
                    <Clock size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                    This section will be deleted in {daysLeft} day{daysLeft === 1 ? '' : 's'} unless you submit verification.
                  </div>
                )}
                {vs === 'rejected' && section.verification?.rejectionReason && (
                  <div className="alert alert-block alert-error">Rejected: {section.verification.rejectionReason}. Please resubmit.</div>
                )}
                <p className="text-secondary" style={{ marginBottom: 'var(--space-2)' }}>Upload your (the CR's) student ID card to verify this section.</p>
                <form onSubmit={submitSectionVerification}>
                  <div className="verify-upload-row">
                    <label className={`verify-upload-tile${verifyDoc ? ' has-file' : ''}`}>
                      <div className="tile-title"><Upload size={15} /> CR student ID card</div>
                      <div className="tile-hint">{verifyDoc ? verifyDoc.file.name : 'Required · tap to choose'}</div>
                      {verifyDoc && <img src={verifyDoc.preview} alt="ID preview" />}
                      <input type="file" accept="image/*" className="sr-only" onChange={(ev) => { const f = ev.target.files[0]; if (f) setVerifyDoc({ file: f, preview: URL.createObjectURL(f) }); }} />
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={verifySubmitting}>
                    {verifySubmitting ? 'Submitting…' : 'Submit for verification'}
                  </button>
                </form>
              </>
            )}
          </div>
        );
      })()}

      <div className="cr-tool-row cr-tool-row-page">
        {CR_TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`cr-tool-btn ${activeTool === t.key ? 'active' : ''}`}
              onClick={() => setActiveTool(t.key)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="cr-tool-content">
        {activeTool === 'members' && <ManageUsers key={section._id} sectionId={section._id} />}
        {activeTool === 'notices' && <PostNotice key={section._id} sectionId={section._id} />}
        {activeTool === 'materials' && <UploadMaterial key={section._id} sectionId={section._id} />}
      </div>
    </div>
  );
};

export default SectionAdmin;
