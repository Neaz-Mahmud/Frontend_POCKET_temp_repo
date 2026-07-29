import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, X, Truck } from 'lucide-react';
import './Public.css';

const NewBooksStore = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null); // book being ordered
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', note: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/books/new').then(({ data }) => setBooks(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openOrder = (book) => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', address: '', note: '', quantity: 1 });
    setMessage(null);
    setOrdering(book);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const { data } = await api.post(`/books/new/${ordering._id}/order`, form);
      setOrdering(null);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Order failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="text-secondary">Loading store…</p>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={22} /></div>
          <div className="empty-state-title">Store is being stocked</div>
          <div className="empty-state-hint">New books with free delivery will appear here soon.</div>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((b) => (
            <div key={b._id} className="card book-card">
              <div className="book-cover">{b.coverUrl ? <img src={b.coverUrl} alt={b.title} /> : <BookOpen size={40} />}</div>
              <div className="book-body">
                <div className="book-title">{b.title}</div>
                {b.author && <div className="book-author">{b.author}</div>}
                <div className="book-price">{b.price > 0 ? `৳${b.price}` : 'Free'}</div>
                <div className="book-meta"><span><Truck size={11} style={{ verticalAlign: '-1px' }} /> Free delivery</span></div>
              </div>
              <div className="book-card-actions">
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openOrder(b)}>Order now</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ordering && (
        <div className="modal-backdrop" onClick={() => setOrdering(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Order: {ordering.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setOrdering(null)}><X size={16} /></button>
            </div>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
              {ordering.price > 0 ? `৳${ordering.price}` : 'Free'} · Free delivery. The admin will contact you to confirm your order.
            </p>
            <form className="form-grid" onSubmit={submitOrder}>
              <div className="form-group"><label>Your name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>Contact phone</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label>Email (optional)</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label>Delivery address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Where should we deliver?" /></div>
              <div className="form-row-2">
                <div className="form-group"><label>Quantity</label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="form-group"><label>Note (optional)</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBooksStore;
