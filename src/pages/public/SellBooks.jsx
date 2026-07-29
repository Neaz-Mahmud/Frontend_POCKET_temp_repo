import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Upload, Trash2, Tag, X, Hourglass } from 'lucide-react';
import './Public.css';
import '../account/Profile.css';

const CONDITIONS = ['new', 'like-new', 'good', 'fair'];
const MAX_PHOTOS = 2;
const empty = { title: '', author: '', price: '', condition: 'good', description: '', contactEmail: '', contactPhone: '', division: '', zila: '', university: '' };

const daysLeft = (expiresAt) => Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / (24 * 3600 * 1000)));

const SellBooks = ({ meta }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...empty, contactEmail: user?.email || '', contactPhone: user?.phone || '' });
  const [photos, setPhotos] = useState([]); // [{ file, preview }] max 2
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [mine, setMine] = useState({ books: [], liveCount: 0, maxActive: 10, ttlDays: 60 });

  const zilas = form.division ? (meta.divisions[form.division] || []) : [];

  const loadMine = useCallback(async () => {
    try {
      const { data } = await api.get('/books/old/mine');
      setMine(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadMine(); }, [loadMine]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'division' ? { zila: '' } : {}) }));

  const addPhoto = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setPhotos((p) => (p.length >= MAX_PHOTOS ? p : [...p, { file, preview: URL.createObjectURL(file) }]));
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const atLimit = mine.liveCount >= mine.maxActive;

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const imageKeys = [];
      for (const photo of photos) {
        const { data: pre } = await api.post('/books/old/cover/presign', { mimeType: photo.file.type });
        await axios.put(pre.presignedUrl, photo.file, { headers: { 'Content-Type': photo.file.type } });
        imageKeys.push(pre.fileKey);
      }
      await api.post('/books/old', { ...form, price: Number(form.price), imageKeys });
      setMessage({ type: 'success', text: 'Listing submitted! It will be public once an admin approves it.' });
      setForm({ ...empty, contactEmail: user?.email || '', contactPhone: user?.phone || '' });
      setPhotos([]);
      loadMine();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not post listing' });
    } finally {
      setSubmitting(false);
    }
  };

  const markSold = async (id, status) => {
    try {
      await api.patch(`/books/old/mine/${id}`, { status });
      loadMine();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/books/old/mine/${id}`);
      loadMine();
    } catch { /* ignore */ }
  };

  return (
    <div>
      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="stat-row">
        <span className="stat-chip"><b>{mine.liveCount}</b> of {mine.maxActive} listing slots used</span>
        <span className="stat-chip"><b>{mine.ttlDays}</b> days — how long each listing stays live</span>
        <span className="stat-chip"><b>{MAX_PHOTOS}</b> photos max per listing</span>
      </div>

      {atLimit && (
        <div className="alert alert-block alert-info">
          You've reached the {mine.maxActive}-listing limit. Delete a listing or mark one sold to post a new one.
        </div>
      )}

      <div className="card" style={{ padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}><Tag size={17} style={{ verticalAlign: '-2px' }} /> Sell a used book</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="form-row-2">
            <div className="form-group"><label>Book title *</label><input required value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="form-group"><label>Author</label><input value={form.author} onChange={(e) => set('author', e.target.value)} /></div>
          </div>
          <div className="form-row-2">
            <div className="form-group"><label>Price (৳) *</label><input type="number" min="0" required value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
            <div className="form-group">
              <label>Condition</label>
              <select value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>

          <div className="form-row-2">
            <div className="form-group"><label>Contact phone *</label><input required value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>
            <div className="form-group"><label>Contact email</label><input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Division *</label>
              <select required value={form.division} onChange={(e) => set('division', e.target.value)}>
                <option value="">Select division</option>
                {Object.keys(meta.divisions).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Zila *</label>
              <select required value={form.zila} onChange={(e) => set('zila', e.target.value)} disabled={!form.division}>
                <option value="">Select zila</option>
                {zilas.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>University *</label>
            <select required value={form.university} onChange={(e) => set('university', e.target.value)}>
              <option value="">Select university</option>
              {meta.universities.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Photos of the book (up to {MAX_PHOTOS})</label>
            <div className="sell-photo-row">
              {photos.map((p, i) => (
                <div key={i} className="sell-photo-thumb">
                  <img src={p.preview} alt={`photo ${i + 1}`} />
                  <button type="button" className="sell-photo-remove" onClick={() => removePhoto(i)} aria-label="Remove photo">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="sell-photo-add">
                  <Upload size={17} />
                  <span>Add photo</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={addPhoto} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={submitting || atLimit}>
            {submitting ? 'Submitting…' : 'Submit listing for approval'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 'var(--space-3)' }}>My listings</h3>
      {mine.books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={22} /></div>
          <div className="empty-state-title">No listings yet</div>
          <div className="empty-state-hint">Your posted books will appear here with their approval status and time remaining.</div>
        </div>
      ) : (
        <div className="row-list">
          {mine.books.map((b) => (
            <div key={b._id} className="member-row">
              <div className="member-avatar" style={{ borderRadius: 'var(--radius-md)' }}>{b.coverUrl ? <img src={b.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : <BookOpen size={16} />}</div>
              <div className="member-info">
                <div className="member-name">{b.title} <span className={`admin-badge ${b.status === 'approved' ? 'verified' : b.status === 'pending' ? 'pending' : 'rejected'}`}>{b.status}</span></div>
                <div className="member-sub">
                  ৳{b.price} · {b.zila}, {b.division}
                  {['pending', 'approved'].includes(b.status) && (
                    <> · <Hourglass size={11} style={{ verticalAlign: '-1px' }} /> {daysLeft(b.expiresAt)} days left</>
                  )}
                  {b.status === 'rejected' && b.rejectionReason ? ` · ${b.rejectionReason}` : ''}
                </div>
              </div>
              <div className="row-actions">
                {b.status === 'approved' && <button className="btn btn-ghost btn-sm" onClick={() => markSold(b._id, 'sold')}>Mark sold</button>}
                {b.status === 'sold' && <button className="btn btn-ghost btn-sm" onClick={() => markSold(b._id, 'approved')}>Reopen</button>}
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(b._id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellBooks;
