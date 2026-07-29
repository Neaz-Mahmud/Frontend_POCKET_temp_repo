import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import NoticeCard from '../../components/NoticeCard';
import '../../styles/Panels.css';
import './PostNotice.css';

const TYPES = [
  { value: 'general', label: 'General' },
  { value: 'ct', label: 'Class Test' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'labtest', label: 'Lab Test' },
  { value: 'custom', label: 'Custom' },
];

const emptyForm = {
  title: '',
  description: '',
  type: 'general',
  occurrenceDate: '',
  mentionedTeachers: [],
};

const PostNotice = ({ sectionId }) => {
  const [teachers, setTeachers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadTeachers = useCallback(async () => {
    try {
      const { data } = await api.get(`/sections/${sectionId}/members`, { params: { role: 'teacher' } });
      setTeachers((data.members || []).map((m) => m.user));
    } catch (err) {
      console.error(err);
    }
  }, [sectionId]);

  const loadNotices = useCallback(async () => {
    setLoadingNotices(true);
    try {
      const { data } = await api.get(`/sections/${sectionId}/notices`);
      setNotices(data.notices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotices(false);
    }
  }, [sectionId]);

  useEffect(() => {
    setForm(emptyForm);
    setEditingId(null);
    loadTeachers();
    loadNotices();
  }, [loadTeachers, loadNotices]);

  const toggleTeacher = (teacherId) => {
    setForm((f) => ({
      ...f,
      mentionedTeachers: f.mentionedTeachers.includes(teacherId)
        ? f.mentionedTeachers.filter((id) => id !== teacherId)
        : [...f.mentionedTeachers, teacherId],
    }));
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id);
    setForm({
      title: notice.title,
      description: notice.description || '',
      type: notice.type,
      occurrenceDate: notice.occurrenceDate ? notice.occurrenceDate.slice(0, 10) : '',
      mentionedTeachers: (notice.mentionedTeachers || []).map((t) => t._id),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (nId) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/sections/${sectionId}/notices/${nId}`);
      loadNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete notice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      occurrenceDate: form.occurrenceDate || null,
      mentionedTeachers: form.mentionedTeachers,
    };
    try {
      if (editingId) {
        await api.patch(`/sections/${sectionId}/notices/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Notice updated' });
      } else {
        await api.post(`/sections/${sectionId}/notices`, payload);
        setMessage({ type: 'success', text: 'Notice posted' });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadNotices();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not save notice' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card notice-form-card">
        <h4 className="notice-form-title">{editingId ? 'Edit Notice' : 'Post a Notice'}</h4>
        {message && <div className={`alert alert-block alert-${message.type}`}>{message.text}</div>}
        <form onSubmit={handleSubmit} className="notice-form">
          <label htmlFor="notice-title" className="sr-only">Title</label>
          <input
            id="notice-title"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <label htmlFor="notice-desc" className="sr-only">Description</label>
          <textarea
            id="notice-desc"
            placeholder="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="notice-form-row">
            <label htmlFor="notice-type" className="sr-only">Notice type</label>
            <select
              id="notice-type"
              className="notice-form-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <label htmlFor="notice-date" className="sr-only">Occurrence date</label>
            <input
              id="notice-date"
              type="date"
              className="notice-form-date"
              value={form.occurrenceDate}
              onChange={(e) => setForm({ ...form, occurrenceDate: e.target.value })}
            />
          </div>

          <div>
            <div className="text-secondary notice-form-mention-label">
              Mention teachers (from this Section)
            </div>
            {teachers.length === 0 ? (
              <div className="empty-state">No active teacher members in this Section yet</div>
            ) : (
              <div className="filter-row">
                {teachers.map((t) => (
                  <button
                    type="button"
                    key={t._id}
                    className={`filter-chip ${form.mentionedTeachers.includes(t._id) ? 'active' : ''}`}
                    onClick={() => toggleTeacher(t._id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="notice-form-actions">
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Update Notice' : 'Post Notice'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <h4 className="existing-notices-heading">Existing Notices</h4>
      {loadingNotices ? (
        <div className="loading-row"><span className="spinner" /> Loading…</div>
      ) : notices.length === 0 ? (
        <div className="empty-state">No notices posted yet</div>
      ) : (
        <div className="notice-list">
          {notices.map((n) => (
            <NoticeCard key={n._id} notice={n} canManage onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostNotice;
