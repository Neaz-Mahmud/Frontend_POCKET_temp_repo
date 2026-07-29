import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Link2, Trash2 } from 'lucide-react';
import '../styles/Panels.css';

const ActiveMirrorsPanel = ({ folderId }) => {
  const [mirrors, setMirrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMirrors = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/teacher-materials/folders/${folderId}/mirrors`);
      setMirrors(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load active mirrors');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchMirrors();
  }, [fetchMirrors]);

  const handleUnlink = async (mirrorId, sectionName, courseName) => {
    if (!window.confirm(`Stop mirroring to ${sectionName} / ${courseName}?`)) return;
    try {
      await api.delete(`/teacher-materials/mirrors/${mirrorId}`);
      fetchMirrors();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to unlink mirror');
    }
  };

  if (loading) return null;

  if (error) {
    return (
      <div className="card mirror-summary-card">
        <div className="mirror-summary-empty text-danger">
          <Link2 size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (mirrors.length === 0) {
    return (
      <div className="card mirror-summary-card">
        <div className="mirror-summary-empty">
          <Link2 size={16} />
          <span>Not mirrored to any sections.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card mirror-summary-card">
      <div className="mirror-summary-header">
        <Link2 size={18} />
        <h4>Active Mirrors</h4>
      </div>
      <div className="mirror-summary-list">
        {mirrors.map(m => (
          <div key={m._id} className="mirror-summary-row">
            <div>
              <div className="mirror-summary-name">{m.section?.name}</div>
              <div className="mirror-summary-sub text-secondary">{m.targetCourse?.name}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm mirror-unlink-btn"
              onClick={() => handleUnlink(m._id, m.section?.name, m.targetCourse?.name)}
              title="Unlink"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveMirrorsPanel;
