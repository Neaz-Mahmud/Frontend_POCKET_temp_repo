import { useState, useEffect } from 'react';
import api from '../../api/axios';
import FileExplorer from '../../components/FileExplorer';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Panels.css';

const PersonalStorage = () => {
  const { user } = useAuth();
  const [quota, setQuota] = useState(null);
  const [semester, setSemester] = useState(null); // { _id, name }
  const [course, setCourse] = useState(null); // { _id, name }

  const refreshQuota = async () => {
    try {
      const { data } = await api.get('/personal/quota');
      setQuota(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { refreshQuota(); }, [course]);

  const pct = quota ? Math.min(100, (quota.used / quota.limit) * 100) : 0;
  const fmtLimit = (b) => (b >= 1024 * 1024 * 1024 ? `${(b / (1024 * 1024 * 1024)).toFixed(0)} GB` : `${(b / (1024 * 1024)).toFixed(0)} MB`);
  const limitLabel = quota ? fmtLimit(quota.limit) : '';

  // Time-of-day greeting on the landing page — a small, warm lead-in so the
  // first screen after login feels addressed to the person, not the feature.
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.trim().split(/\s+/)[0] || '';

  // A plain-language read on how full the space is, so the bar isn't the only
  // signal. The thresholds line up with when the fill turns red (>90%).
  const quotaCaption =
    pct < 50 ? 'Plenty of room to spare.'
    : pct < 80 ? 'Filling up steadily.'
    : pct <= 90 ? 'Getting close to your limit.'
    : 'Almost full — clear out a few files to free up space.';

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">{greeting}{firstName ? `, ${firstName}` : ''}</p>
        <h2>Personal Storage</h2>
        <p className="text-secondary">Private files only you can see{limitLabel ? ` — ${limitLabel} quota` : ''}{quota && !quota.verified ? ' · verify your account for more' : ''}</p>
      </div>

      {quota && (
        <div className="card quota-card">
          <div className="quota-head">
            <div>
              <div className="quota-label">Storage used</div>
              <div className="quota-values">
                {(quota.used / 1024 / 1024).toFixed(1)}
                <span> MB of {(quota.limit / 1024 / 1024).toFixed(0)} MB</span>
              </div>
            </div>
            <div className={`quota-pct${pct > 90 ? ' is-danger' : ''}`}>{Math.round(pct)}%</div>
          </div>
          <div className="quota-track">
            <div
              className={`quota-fill${pct > 90 ? ' is-danger' : ''}`}
              style={{ '--quota-pct': `${pct}%` }}
            />
          </div>
          <div className={`quota-caption${pct > 90 ? ' is-danger' : ''}`}>{quotaCaption}</div>
        </div>
      )}

      {!semester && (
        <FileExplorer
          endpoint="/personal"
          mode="folders"
          parentId={null}
          folderType="semester"
          onFolderClick={setSemester}
          title="Semesters"
        />
      )}

      {semester && !course && (
        <FileExplorer
          endpoint="/personal"
          mode="folders"
          parentId={semester._id}
          folderType="course"
          onFolderClick={setCourse}
          onBack={() => setSemester(null)}
          title={semester.name}
        />
      )}

      {semester && course && (
        <FileExplorer
          endpoint="/personal"
          mode="files"
          folderId={course._id}
          onBack={() => setCourse(null)}
          title={`${semester.name} / ${course.name}`}
          maxSize={quota ? quota.available : undefined}
        />
      )}
    </div>
  );
};

export default PersonalStorage;
