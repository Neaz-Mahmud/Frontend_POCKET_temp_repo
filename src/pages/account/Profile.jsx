import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Camera, ShieldCheck, Upload, Clock } from 'lucide-react';
import { identityStyle } from '../../utils/identityColor';
import '../../styles/Panels.css';
import './Profile.css';

const MB = 1024 * 1024;
const fmtMB = (b) => (b >= 1024 * MB ? `${(b / (1024 * MB)).toFixed(0)} GB` : `${(b / MB).toFixed(0)} MB`);

const Profile = () => {
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [me, setMe] = useState(user);
  const [quota, setQuota] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState(null);

  // Verification form state
  const [fields, setFields] = useState({ university: '', sectionName: '', batch: '', studentId: '' });
  const [idCard, setIdCard] = useState(null); // { file, preview }
  const [nid, setNid] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMe = async () => {
    try {
      const { data } = await api.get('/users/me');
      setMe(data.user);
      setQuota(data.quota);
      setFields({
        university: data.user.university || '',
        sectionName: data.user.sectionName || '',
        batch: data.user.batch || '',
        studentId: data.user.studentId || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.patch('/users/me', { name, ...(isStudent ? fields : {}) });
      setUser((u) => ({ ...u, ...data }));
      setMe(data);
      setMessage({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const { data } = await api.post('/users/me/avatar/presign', { mimeType: file.type });
      await axios.put(data.presignedUrl, file, { headers: { 'Content-Type': file.type } });
      const { data: updated } = await api.post('/users/me/avatar/confirm', { fileKey: data.fileKey });
      setUser((u) => ({ ...u, ...updated }));
      setMe(updated);
      setMessage({ type: 'success', text: 'Profile picture updated' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Avatar upload failed' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const pickDoc = (setter) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setter({ file, preview: URL.createObjectURL(file) });
  };

  const uploadDoc = async (target, file) => {
    const { data } = await api.post('/users/me/verification/presign', { target, mimeType: file.type });
    await axios.put(data.presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return data.fileKey;
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!idCard) { setMessage({ type: 'error', text: 'Please upload your ID card' }); return; }
    if (isStudent) {
      const missing = ['university', 'sectionName', 'batch', 'studentId'].filter((f) => !fields[f]?.trim());
      if (missing.length) { setMessage({ type: 'error', text: 'Fill in all student details first' }); return; }
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const idCardKey = await uploadDoc('idCard', idCard.file);
      const nidKey = nid ? await uploadDoc('nid', nid.file) : null;
      const { data } = await api.post('/users/me/verification/submit', {
        idCardKey, nidKey, ...(isStudent ? fields : {}),
      });
      setUser((u) => ({ ...u, ...data }));
      setMe(data);
      setIdCard(null); setNid(null);
      setMessage({ type: 'success', text: 'Submitted! An admin will review your verification shortly.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const status = me?.verification?.status || 'unverified';
  const daysLeft = me?.deletionDueAt ? Math.max(0, Math.ceil((new Date(me.deletionDueAt) - Date.now()) / (24 * 3600 * 1000))) : null;
  const tier = { student: { low: 50 * MB, high: 150 * MB }, teacher: { low: 50 * MB, high: 2 * 1024 * MB } }[me?.role];
  const canSubmit = status === 'unverified' || status === 'rejected';

  return (
    <div>
      <div className="page-header">
        <h2>Profile</h2>
        <p className="text-secondary">Your personal account details</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="avatar-upload-row">
        <div className="avatar-lg" style={identityStyle(me?._id || me?.name)}>{me?.name?.charAt(0).toUpperCase() || '?'}</div>
        <div>
          <label htmlFor="avatar-input" className="btn btn-secondary btn-sm avatar-upload-label">
            <Camera size={15} /> {uploadingAvatar ? 'Uploading…' : 'Change photo'}
          </label>
          <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="sr-only" />
        </div>
      </div>

      <form onSubmit={handleSave} className="form-grid profile-form">
        <div className="form-group">
          <label htmlFor="profile-name">Full Name</label>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">Email (fixed at registration)</label>
          <input id="profile-email" value={me?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label htmlFor="profile-phone">Phone (fixed at registration)</label>
          <input id="profile-phone" value={me?.phone || ''} disabled />
        </div>
        <div className="form-group">
          <label htmlFor="profile-role">Account type</label>
          <input id="profile-role" value={me?.role || ''} disabled className="profile-role-input" />
        </div>

        {isStudent && (
          <>
            <div className="form-group">
              <label>University</label>
              <input value={fields.university} onChange={(e) => setFields({ ...fields, university: e.target.value })} disabled={status === 'verified'} placeholder="e.g. Varendra University" />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input value={fields.sectionName} onChange={(e) => setFields({ ...fields, sectionName: e.target.value })} disabled={status === 'verified'} placeholder="e.g. 63_G" />
            </div>
            <div className="form-group">
              <label>Batch</label>
              <input value={fields.batch} onChange={(e) => setFields({ ...fields, batch: e.target.value })} disabled={status === 'verified'} placeholder="e.g. 63" />
            </div>
            <div className="form-group">
              <label>Student ID</label>
              <input value={fields.studentId} onChange={(e) => setFields({ ...fields, studentId: e.target.value })} disabled={status === 'verified'} placeholder="e.g. 223311239" />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary profile-save-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {!isAdmin && (
        <div className="card verify-block">
          <div className="verify-block-head">
            <h3><ShieldCheck size={19} /> Account verification</h3>
            <span className={`verify-status-badge ${status}`}>{status}</span>
          </div>

          {tier && (
            <div className="verify-tier">
              <span className="verify-tier-item">Unverified: <b>{fmtMB(tier.low)}</b></span>
              <span className="verify-tier-item">Verified: <b>{fmtMB(tier.high)}</b>{me?.role === 'teacher' ? ' (personal + shared material combined)' : ''}</span>
              {quota && <span className="verify-tier-item">Current limit: <b>{fmtMB(quota.limit)}</b></span>}
            </div>
          )}

          {status === 'verified' && (
            <p className="text-secondary">Your account is verified. Enjoy your upgraded storage.</p>
          )}

          {status === 'pending' && (
            <p className="text-secondary">Your verification is under review. You'll be upgraded once an admin approves it.</p>
          )}

          {canSubmit && (
            <>
              {daysLeft !== null && (
                <div className="verify-warning">
                  <Clock size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Your account will be automatically deleted in {daysLeft} day{daysLeft === 1 ? '' : 's'} unless you submit verification.
                </div>
              )}
              {status === 'rejected' && me?.verification?.rejectionReason && (
                <div className="alert alert-block alert-error">Previous submission rejected: {me.verification.rejectionReason}. Please resubmit.</div>
              )}
              <p className="text-secondary" style={{ marginBottom: 'var(--space-2)' }}>
                Upload your {me?.role === 'teacher' ? 'teacher' : 'student'} ID card{isStudent ? ' (NID optional)' : ''}. {isStudent ? 'Make sure your student details above are correct first.' : ''}
              </p>

              <form onSubmit={submitVerification}>
                <div className="verify-upload-row">
                  <label className={`verify-upload-tile${idCard ? ' has-file' : ''}`}>
                    <div className="tile-title"><Upload size={15} /> {me?.role === 'teacher' ? 'Teacher' : 'Student'} ID card</div>
                    <div className="tile-hint">{idCard ? idCard.file.name : 'Required · tap to choose'}</div>
                    {idCard && <img src={idCard.preview} alt="ID preview" />}
                    <input type="file" accept="image/*" className="sr-only" onChange={pickDoc(setIdCard)} />
                  </label>

                  {isStudent && (
                    <label className={`verify-upload-tile${nid ? ' has-file' : ''}`}>
                      <div className="tile-title"><Upload size={15} /> NID</div>
                      <div className="tile-hint">{nid ? nid.file.name : 'Optional · tap to choose'}</div>
                      {nid && <img src={nid.preview} alt="NID preview" />}
                      <input type="file" accept="image/*" className="sr-only" onChange={pickDoc(setNid)} />
                    </label>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit for verification'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
