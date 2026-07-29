import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../api/axios';
import { identityColor } from '../utils/identityColor';

/**
 * Dropdown of the current user's active sections.
 * Props: value (section object or null), onChange(section), roleFilter (optional memberRole filter), autoSelectFirst
 */
const SectionSelect = ({ value, onChange, roleFilter, autoSelectFirst = true, label = 'Section' }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/sections/my');
        const filtered = roleFilter ? data.filter((s) => s.memberRole === roleFilter) : data;
        setSections(filtered);
        if (autoSelectFirst && !value && filtered.length > 0) {
          onChange(filtered[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="loading-row"><span className="spinner" /> Loading sections…</div>;

  if (sections.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon"><Users size={22} /></span>
        <span className="empty-state-title">No Sections yet</span>
        <span className="empty-state-hint">
          Head to My Sections and join one with its code — its notices and materials will appear here.
        </span>
      </div>
    );
  }

  return (
    <div className="form-group section-select">
      <label htmlFor="section-select-input">{label}</label>
      <div className="section-select-control">
        {value && (
          <span
            className="section-select-swatch"
            style={{ background: identityColor(value._id).bg }}
            aria-hidden="true"
          />
        )}
        <select
          id="section-select-input"
          className={value ? 'has-swatch' : ''}
          value={value?._id || ''}
          onChange={(e) => onChange(sections.find((s) => s._id === e.target.value) || null)}
        >
          {sections.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SectionSelect;
