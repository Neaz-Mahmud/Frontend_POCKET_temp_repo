import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Briefcase, Search } from 'lucide-react';
import { useCentralBase } from '../../utils/centralBase';
import './Public.css';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'government', label: 'Government' },
  { key: 'non-government', label: 'Non-government' },
  { key: 'other', label: 'Other' },
];

const JobsBrowse = () => {
  const base = useCentralBase();
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (q) params.q = q;
      const { data } = await api.get('/jobs', { params });
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, q]);

  useEffect(() => { load(); }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Central Segment</p>
        <h2>Job Query</h2>
        <p className="text-secondary">Step-by-step guides on how organizations recruit — government &amp; private.</p>
      </div>

      <form className="admin-toolbar" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input className="admin-search" placeholder="Search organization or post…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-secondary btn-sm" type="submit"><Search size={15} /> Search</button>
      </form>

      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" className={`filter-chip${category === c.key ? ' active' : ''}`} onClick={() => setCategory(c.key)}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-secondary">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={22} /></div>
          <div className="empty-state-title">No job guides here yet</div>
          <div className="empty-state-hint">Recruitment guides are curated by the platform team — check back soon.</div>
        </div>
      ) : (
        <div className="job-grid">
          {posts.map((p) => (
            <Link key={p._id} to={`${base}/jobs/${p._id}`} className="card job-card">
              <div className="job-cover">{p.coverUrl ? <img src={p.coverUrl} alt={p.organization} /> : <Briefcase size={34} />}</div>
              <div className="job-body">
                <div className="job-org">{p.organization}</div>
                {p.position && <div className="job-position">{p.position}</div>}
                {p.summary && <div className="job-summary">{p.summary}</div>}
                <span className="job-cat">{p.category}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsBrowse;
