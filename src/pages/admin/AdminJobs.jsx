import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../api/axios';
import ReactBlock from '../../components/ReactBlock';
import {
  Briefcase, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Type, Image as ImageIcon,
  Video, FileUp, Inbox, ArrowLeft, Upload, Code2, Eye,
} from 'lucide-react';
import '../../styles/Panels.css';
import '../public/Public.css';
import '../account/Profile.css';
import './Admin.css';

const emptyPost = { organization: '', position: '', category: 'other', summary: '', coverKey: null, coverUrl: null, blocks: [], published: true };

const REACT_TEMPLATE = `function App() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Apply online', detail: 'Submit the application form with your CV.' },
    { title: 'Written exam', detail: 'MCQ + written test on the announced date.' },
    { title: 'Interview', detail: 'Panel interview for shortlisted candidates.' },
  ];
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
      {steps.map((s, i) => (
        <div key={i} onClick={() => setStep(i)}
          style={{ padding: '12px 16px', cursor: 'pointer',
            background: i === step ? '#7c3aed' : 'transparent',
            color: i === step ? '#fff' : 'inherit' }}>
          <b>{i + 1}. {s.title}</b>
          {i === step && <div style={{ marginTop: 4, fontSize: 13 }}>{s.detail}</div>}
        </div>
      ))}
    </div>
  );
}`;

// Code editor + live sandboxed preview for a 'react' block. The preview only
// re-renders on demand (button) or when toggled open, so typing stays smooth.
const ReactBlockEditor = ({ block, onChange }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState(block.code);

  const refresh = () => { setPreviewCode(block.code); setShowPreview(true); };

  return (
    <div>
      <p className="react-editor-hint">
        Write JSX — define <code>function App() {'{ … }'}</code> (hooks like <code>useState</code> are available),
        or a single JSX expression. It renders for readers exactly like the preview.
      </p>
      <textarea
        rows="10"
        className="react-code-input"
        value={block.code}
        onChange={(e) => onChange({ code: e.target.value })}
        placeholder={REACT_TEMPLATE}
        spellCheck={false}
      />
      <div className="react-editor-actions">
        {!block.code && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ code: REACT_TEMPLATE })}>
            <Code2 size={14} /> Insert example
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={refresh}>
          <Eye size={14} /> {showPreview ? 'Refresh preview' : 'Preview'}
        </button>
      </div>
      {showPreview && previewCode && (
        <div className="react-preview-frame">
          <ReactBlock code={previewCode} />
        </div>
      )}
    </div>
  );
};

const AdminJobs = () => {
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(emptyPost);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadList = useCallback(async () => {
    try { const { data } = await api.get('/jobs/admin'); setPosts(data); } catch { /* */ }
  }, []);
  useEffect(() => { loadList(); }, [loadList]);

  const uploadAsset = async (target, file) => {
    const { data } = await api.post('/jobs/admin/upload/presign', { target, mimeType: file.type, fileName: file.name });
    await axios.put(data.presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return data.fileKey;
  };

  const startCreate = () => { setPost(emptyPost); setEditingId(null); setMessage(null); setView('edit'); };
  const startEdit = async (id) => {
    setMessage(null);
    try {
      const { data } = await api.get(`/jobs/admin/${id}`);
      setPost({ ...emptyPost, ...data });
      setEditingId(id);
      setView('edit');
    } catch { setMessage({ type: 'error', text: 'Could not load post' }); }
  };
  const removePost = async (id) => {
    if (!window.confirm('Delete this job post?')) return;
    try { await api.delete(`/jobs/admin/${id}`); loadList(); } catch { /* */ }
  };

  // ── Cover ──
  const onCover = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const coverKey = await uploadAsset('cover', file);
      setPost((p) => ({ ...p, coverKey, coverUrl: URL.createObjectURL(file) }));
    } catch { setMessage({ type: 'error', text: 'Cover upload failed' }); }
  };

  // ── Blocks ──
  const addBlock = (type) => {
    const base = { type, text: '', youtubeUrl: '', imageKey: null, imageUrl: null, fileKey: null, fileName: '', code: '' };
    setPost((p) => ({ ...p, blocks: [...p.blocks, base] }));
  };
  const updateBlock = (i, patch) => setPost((p) => ({ ...p, blocks: p.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));
  const removeBlock = (i) => setPost((p) => ({ ...p, blocks: p.blocks.filter((_, idx) => idx !== i) }));
  const moveBlock = (i, dir) => setPost((p) => {
    const j = i + dir; if (j < 0 || j >= p.blocks.length) return p;
    const blocks = [...p.blocks]; [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...p, blocks };
  });
  const onBlockImage = async (i, e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const imageKey = await uploadAsset('image', file); updateBlock(i, { imageKey, imageUrl: URL.createObjectURL(file) }); }
    catch { setMessage({ type: 'error', text: 'Image upload failed' }); }
  };
  const onBlockFile = async (i, e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const fileKey = await uploadAsset('file', file); updateBlock(i, { fileKey, fileName: file.name }); }
    catch { setMessage({ type: 'error', text: 'File upload failed' }); }
  };

  const save = async () => {
    if (!post.organization.trim()) { setMessage({ type: 'error', text: 'Organization name is required' }); return; }
    setSaving(true); setMessage(null);
    const payload = {
      organization: post.organization, position: post.position, category: post.category,
      summary: post.summary, coverKey: post.coverKey, published: post.published,
      blocks: post.blocks,
    };
    try {
      if (editingId) await api.patch(`/jobs/admin/${editingId}`, payload);
      else await api.post('/jobs/admin', payload);
      await loadList();
      setView('list');
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed' }); }
    finally { setSaving(false); }
  };

  if (view === 'list') {
    return (
      <div>
        <div className="page-header">
          <h2>Job Query</h2>
          <p className="text-secondary">Publish recruitment guides with text, images, video, and downloads.</p>
        </div>
        {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}
        <button className="btn btn-primary" style={{ marginBottom: 'var(--space-5)' }} onClick={startCreate}><Plus size={16} /> New job post</button>

        {posts.length === 0 ? (
          <div className="admin-empty"><Inbox size={40} /><p>No job posts yet.</p></div>
        ) : (
          <div className="row-list">
            {posts.map((p) => (
              <div key={p._id} className="member-row">
                <div className="member-avatar" style={{ borderRadius: 'var(--radius-md)' }}>{p.coverUrl ? <img src={p.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : <Briefcase size={16} />}</div>
                <div className="member-info">
                  <div className="member-name">{p.organization} <span className={`admin-badge ${p.published ? 'verified' : 'unverified'}`}>{p.published ? 'published' : 'draft'}</span></div>
                  <div className="member-sub">{p.position || '—'} · {p.category}</div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p._id)}><Edit2 size={15} /></button>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => removePost(p._id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Editor ──
  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-3)' }} onClick={() => setView('list')}><ArrowLeft size={15} /> Back to posts</button>
      <div className="page-header"><h2>{editingId ? 'Edit' : 'New'} job post</h2></div>
      {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}

      <div className="card" style={{ padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-5)' }}>
        <div className="form-grid">
          <div className="form-row-2">
            <div className="form-group"><label>Organization / company *</label><input value={post.organization} onChange={(e) => setPost({ ...post, organization: e.target.value })} placeholder="e.g. Bangladesh Bank" /></div>
            <div className="form-group"><label>Post / position</label><input value={post.position} onChange={(e) => setPost({ ...post, position: e.target.value })} placeholder="e.g. Assistant Director (may be left blank)" /></div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Category</label>
              <select value={post.category} onChange={(e) => setPost({ ...post, category: e.target.value })}>
                <option value="government">Government</option>
                <option value="non-government">Non-government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={post.published} onChange={(e) => setPost({ ...post, published: e.target.checked })} /> Published (visible to everyone)
              </label>
            </div>
          </div>
          <div className="form-group"><label>Short summary (shown on the card)</label><input value={post.summary} onChange={(e) => setPost({ ...post, summary: e.target.value })} maxLength={500} /></div>

          <label className={`verify-upload-tile${post.coverUrl ? ' has-file' : ''}`} style={{ maxWidth: 280 }}>
            <div className="tile-title"><Upload size={15} /> Cover photo</div>
            <div className="tile-hint">{post.coverUrl ? 'Change cover' : 'Tap to choose'}</div>
            {post.coverUrl && <img src={post.coverUrl} alt="cover" />}
            <input type="file" accept="image/*" className="sr-only" onChange={onCover} />
          </label>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--space-3)' }}>Content</h3>
      <div className="block-editor">
        {post.blocks.map((b, i) => (
          <div key={i} className="block-row">
            <div className="block-row-head">
              <span className="block-type-label">{b.type}</span>
              <div className="block-row-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => moveBlock(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => moveBlock(i, 1)} disabled={i === post.blocks.length - 1}><ArrowDown size={14} /></button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeBlock(i)}><Trash2 size={14} /></button>
              </div>
            </div>
            {b.type === 'text' && (
              <textarea rows="4" value={b.text} onChange={(e) => updateBlock(i, { text: e.target.value })} placeholder="Write the process, requirements, tips…" style={{ width: '100%' }} />
            )}
            {b.type === 'youtube' && (
              <input value={b.youtubeUrl} onChange={(e) => updateBlock(i, { youtubeUrl: e.target.value })} placeholder="Paste a YouTube link" style={{ width: '100%' }} />
            )}
            {b.type === 'image' && (
              <label className={`verify-upload-tile${b.imageUrl ? ' has-file' : ''}`} style={{ maxWidth: 260 }}>
                <div className="tile-title"><ImageIcon size={15} /> {b.imageUrl ? 'Change image' : 'Upload image'}</div>
                {b.imageUrl && <img src={b.imageUrl} alt="" />}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onBlockImage(i, e)} />
              </label>
            )}
            {b.type === 'file' && (
              <label className={`verify-upload-tile${b.fileName ? ' has-file' : ''}`} style={{ maxWidth: 280 }}>
                <div className="tile-title"><FileUp size={15} /> {b.fileName || 'Upload PDF / DOCX'}</div>
                <div className="tile-hint">Readers can download this file</div>
                <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => onBlockFile(i, e)} />
              </label>
            )}
            {b.type === 'react' && (
              <ReactBlockEditor block={b} onChange={(patch) => updateBlock(i, patch)} />
            )}
          </div>
        ))}

        <div className="add-block-row">
          <button className="btn btn-secondary btn-sm" onClick={() => addBlock('text')}><Type size={14} /> Text</button>
          <button className="btn btn-secondary btn-sm" onClick={() => addBlock('image')}><ImageIcon size={14} /> Image</button>
          <button className="btn btn-secondary btn-sm" onClick={() => addBlock('youtube')}><Video size={14} /> YouTube</button>
          <button className="btn btn-secondary btn-sm" onClick={() => addBlock('file')}><FileUp size={14} /> PDF / DOCX</button>
          <button className="btn btn-secondary btn-sm" onClick={() => addBlock('react')}><Code2 size={14} /> React component</button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish post'}</button>
        <button className="btn btn-ghost" onClick={() => setView('list')}>Cancel</button>
      </div>
    </div>
  );
};

export default AdminJobs;
