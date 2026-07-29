import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../api/axios';
import { BookOpen, Check, X, Trash2, Plus, Upload, Inbox, Phone, Mail } from 'lucide-react';
import '../../styles/Panels.css';
import '../public/Public.css';
import '../account/Profile.css';
import './Admin.css';

const emptyNew = { title: '', author: '', price: '', description: '', stock: '', active: true };

const AdminBooks = () => {
  const [tab, setTab] = useState('pending');
  const [message, setMessage] = useState(null);

  // Old-book moderation
  const [oldStatus, setOldStatus] = useState('pending');
  const [oldBooks, setOldBooks] = useState([]);
  // New books
  const [newBooks, setNewBooks] = useState([]);
  const [form, setForm] = useState(emptyNew);
  const [cover, setCover] = useState(null);
  const [savingNew, setSavingNew] = useState(false);
  // Orders
  const [orders, setOrders] = useState([]);

  const loadOld = useCallback(async () => {
    try { const { data } = await api.get('/books/admin/old', { params: { status: oldStatus } }); setOldBooks(data); } catch { /* */ }
  }, [oldStatus]);
  const loadNew = useCallback(async () => {
    try { const { data } = await api.get('/books/new'); setNewBooks(data); } catch { /* */ }
  }, []);
  const loadOrders = useCallback(async () => {
    try { const { data } = await api.get('/books/admin/orders'); setOrders(data); } catch { /* */ }
  }, []);

  useEffect(() => { if (tab === 'pending') loadOld(); }, [tab, loadOld]);
  useEffect(() => { if (tab === 'new') loadNew(); }, [tab, loadNew]);
  useEffect(() => { if (tab === 'orders') loadOrders(); }, [tab, loadOrders]);

  const moderate = async (id, action) => {
    let reason;
    if (action === 'reject') { reason = window.prompt('Reason for rejection:', 'Does not meet listing guidelines'); if (reason === null) return; }
    try {
      await api.post(`/books/admin/old/${id}/${action}`, action === 'reject' ? { reason } : {});
      setOldBooks((b) => b.filter((x) => x._id !== id));
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' }); }
  };
  const deleteOld = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try { await api.delete(`/books/admin/old/${id}`); setOldBooks((b) => b.filter((x) => x._id !== id)); } catch { /* */ }
  };

  const createNew = async (e) => {
    e.preventDefault();
    setSavingNew(true); setMessage(null);
    try {
      let coverKey = null;
      if (cover) {
        const { data: pre } = await api.post('/books/admin/new/cover/presign', { mimeType: cover.file.type });
        await axios.put(pre.presignedUrl, cover.file, { headers: { 'Content-Type': cover.file.type } });
        coverKey = pre.fileKey;
      }
      await api.post('/books/admin/new', { ...form, price: Number(form.price) || 0, coverKey });
      setForm(emptyNew); setCover(null);
      setMessage({ type: 'success', text: 'New book added to the store.' });
      loadNew();
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add book' }); }
    finally { setSavingNew(false); }
  };
  const toggleActive = async (b) => {
    try { await api.patch(`/books/admin/new/${b._id}`, { active: !b.active }); loadNew(); } catch { /* */ }
  };
  const deleteNew = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try { await api.delete(`/books/admin/new/${id}`); loadNew(); } catch { /* */ }
  };

  const setOrderStatus = async (id, status) => {
    try { const { data } = await api.patch(`/books/admin/orders/${id}`, { status }); setOrders((o) => o.map((x) => (x._id === id ? data : x))); } catch { /* */ }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Book Sharing</h2>
        <p className="text-secondary">Approve used-book listings, stock the new-book store, and manage orders.</p>
      </div>

      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Used-book listings</button>
        <button className={`admin-tab${tab === 'new' ? ' active' : ''}`} onClick={() => setTab('new')}>New-book store</button>
        <button className={`admin-tab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
      </div>

      {tab === 'pending' && (
        <>
          <div className="filter-row">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button key={s} className={`filter-chip${oldStatus === s ? ' active' : ''}`} onClick={() => setOldStatus(s)}>{s}</button>
            ))}
          </div>
          {oldBooks.length === 0 ? (
            <div className="admin-empty"><Inbox size={40} /><p>No {oldStatus} listings.</p></div>
          ) : (
            <div className="verify-list">
              {oldBooks.map((b) => (
                <div key={b._id} className="card verify-card">
                  <div className="verify-card-head">
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      {(b.imageUrls?.length ? b.imageUrls : [null]).map((url, i) => (
                        <div key={i} className="book-cover" style={{ width: 60, height: 80, borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                          {url ? (
                            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                              <img src={url} alt={`photo ${i + 1}`} />
                            </a>
                          ) : <BookOpen size={22} />}
                        </div>
                      ))}
                      <div>
                        <div className="verify-card-title">{b.title} — ৳{b.price}</div>
                        <div className="verify-card-sub">{b.author || 'Unknown author'} · {b.condition}</div>
                        <div className="verify-card-sub">{b.zila}, {b.division} · {b.university}</div>
                        <div className="verify-card-sub">Seller: {b.seller?.name} ({b.contactPhone})</div>
                      </div>
                    </div>
                  </div>
                  {b.description && <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>{b.description}</p>}
                  <div className="verify-actions">
                    {oldStatus === 'pending' && <>
                      <button className="btn btn-primary btn-sm" onClick={() => moderate(b._id, 'approve')}><Check size={15} /> Approve</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => moderate(b._id, 'reject')}><X size={15} /> Reject</button>
                    </>}
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteOld(b._id)}><Trash2 size={15} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'new' && (
        <>
          <div className="card" style={{ padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}><Plus size={17} style={{ verticalAlign: '-3px' }} /> Add a new book</h3>
            <form className="form-grid" onSubmit={createNew}>
              <div className="form-row-2">
                <div className="form-group"><label>Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="form-group"><label>Author</label><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
              </div>
              <div className="form-row-2">
                <div className="form-group"><label>Price (৳, 0 = free)</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label>Stock (blank = untracked)</label><input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className={`verify-upload-tile${cover ? ' has-file' : ''}`} style={{ maxWidth: 260 }}>
                <div className="tile-title"><Upload size={15} /> Cover photo</div>
                <div className="tile-hint">{cover ? cover.file.name : 'Tap to choose'}</div>
                {cover && <img src={cover.preview} alt="cover" />}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files[0]; if (f) setCover({ file: f, preview: URL.createObjectURL(f) }); }} />
              </label>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={savingNew}>{savingNew ? 'Saving…' : 'Add book'}</button>
            </form>
          </div>

          {newBooks.length === 0 ? (
            <div className="admin-empty"><Inbox size={40} /><p>No books in the store yet.</p></div>
          ) : (
            <div className="row-list">
              {newBooks.map((b) => (
                <div key={b._id} className="member-row">
                  <div className="member-avatar" style={{ borderRadius: 'var(--radius-md)' }}>{b.coverUrl ? <img src={b.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : <BookOpen size={16} />}</div>
                  <div className="member-info">
                    <div className="member-name">{b.title} <span className={`admin-badge ${b.active ? 'verified' : 'unverified'}`}>{b.active ? 'live' : 'hidden'}</span></div>
                    <div className="member-sub">{b.price > 0 ? `৳${b.price}` : 'Free'} · {b.author || '—'}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(b)}>{b.active ? 'Hide' : 'Show'}</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteNew(b._id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="admin-empty"><Inbox size={40} /><p>No orders yet.</p></div>
        ) : (
          <div className="row-list">
            {orders.map((o) => (
              <div key={o._id} className="member-row" style={{ alignItems: 'flex-start' }}>
                <div className="member-info">
                  <div className="member-name">{o.book?.title || 'Book'} × {o.quantity} <span className={`admin-badge ${o.status === 'confirmed' || o.status === 'delivered' ? 'verified' : o.status === 'pending' ? 'pending' : 'rejected'}`}>{o.status}</span></div>
                  <div className="member-sub">{o.name} · <Phone size={11} style={{ verticalAlign: '-1px' }} /> {o.phone}{o.email ? <> · <Mail size={11} style={{ verticalAlign: '-1px' }} /> {o.email}</> : ''}</div>
                  {o.address && <div className="member-sub">📍 {o.address}</div>}
                  {o.note && <div className="member-sub">“{o.note}”</div>}
                </div>
                <div className="row-actions" style={{ flexWrap: 'wrap' }}>
                  {o.status === 'pending' && <>
                    <button className="btn btn-primary btn-sm" onClick={() => setOrderStatus(o._id, 'confirmed')}>Confirm</button>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setOrderStatus(o._id, 'cancelled')}>Cancel</button>
                  </>}
                  {o.status === 'confirmed' && <button className="btn btn-secondary btn-sm" onClick={() => setOrderStatus(o._id, 'delivered')}>Mark delivered</button>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminBooks;
