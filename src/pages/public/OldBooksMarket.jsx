import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { BookOpen, Phone, Mail, MapPin, School, SlidersHorizontal } from 'lucide-react';
import './Public.css';

// A book card's cover with up to two photos; the dots (and clicking the image)
// flip between them.
const BookPhotos = ({ book }) => {
  const [idx, setIdx] = useState(0);
  const urls = book.imageUrls?.length ? book.imageUrls : (book.coverUrl ? [book.coverUrl] : []);
  if (urls.length === 0) return <div className="book-cover"><BookOpen size={40} /></div>;
  return (
    <div
      className="book-cover"
      onClick={() => urls.length > 1 && setIdx((i) => (i + 1) % urls.length)}
      style={urls.length > 1 ? { cursor: 'pointer' } : undefined}
      title={urls.length > 1 ? 'Click to see the other photo' : undefined}
    >
      <img src={urls[idx]} alt={book.title} />
      {urls.length > 1 && (
        <div className="book-photo-dots">
          {urls.map((_, i) => <span key={i} className={`book-photo-dot${i === idx ? ' active' : ''}`} />)}
        </div>
      )}
    </div>
  );
};

const OldBooksMarket = ({ meta }) => {
  const [filters, setFilters] = useState({ division: '', zila: '', university: '', minPrice: '', maxPrice: '', sort: 'newest' });
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({}); // id -> true

  const zilas = filters.division ? (meta.divisions[filters.division] || []) : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get('/books/old', { params });
      setBooks(data.books);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v, ...(k === 'division' ? { zila: '' } : {}) }));

  return (
    <div>
      <div className="book-filters">
        <div className="form-group">
          <label>Division</label>
          <select value={filters.division} onChange={(e) => set('division', e.target.value)}>
            <option value="">All divisions</option>
            {Object.keys(meta.divisions).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Zila</label>
          <select value={filters.zila} onChange={(e) => set('zila', e.target.value)} disabled={!filters.division}>
            <option value="">All zilas</option>
            {zilas.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>University</label>
          <select value={filters.university} onChange={(e) => set('university', e.target.value)}>
            <option value="">All universities</option>
            {meta.universities.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Price range (৳)</label>
          <div className="price-range">
            <input type="number" min="0" placeholder="Min" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
            <span>–</span>
            <input type="number" min="0" placeholder="Max" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label><SlidersHorizontal size={12} style={{ verticalAlign: '-1px' }} /> Sort</label>
          <select value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary">Loading books…</p>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={22} /></div>
          <div className="empty-state-title">No books here yet</div>
          <div className="empty-state-hint">Try widening your filters — or be the first to list a book for your campus.</div>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((b) => (
            <div key={b._id} className="card book-card">
              <BookPhotos book={b} />
              <div className="book-body">
                <div className="book-title">{b.title}</div>
                {b.author && <div className="book-author">{b.author}</div>}
                <div className="book-price">৳{b.price}</div>
                <div>{b.condition && <span className="book-condition">{b.condition}</span>}</div>
                <div className="book-meta">
                  <span><MapPin size={11} style={{ verticalAlign: '-1px' }} /> {b.zila}, {b.division}</span>
                  <span><School size={11} style={{ verticalAlign: '-1px' }} /> {b.university}</span>
                </div>
                {revealed[b._id] && (
                  <div className="contact-box">
                    <div><Phone size={12} style={{ verticalAlign: '-2px' }} /> <a href={`tel:${b.contactPhone}`}>{b.contactPhone}</a></div>
                    {b.contactEmail && <div><Mail size={12} style={{ verticalAlign: '-2px' }} /> <a href={`mailto:${b.contactEmail}`}>{b.contactEmail}</a></div>}
                  </div>
                )}
              </div>
              <div className="book-card-actions">
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setRevealed((r) => ({ ...r, [b._id]: !r[b._id] }))}>
                  {revealed[b._id] ? 'Hide contact' : 'Contact seller'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OldBooksMarket;
