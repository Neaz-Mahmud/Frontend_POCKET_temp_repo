import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import FileExplorer from '../../components/FileExplorer';
import MirrorRequestsInbox from '../../components/MirrorRequestsInbox';
import ActiveMirrorsPanel from '../../components/ActiveMirrorsPanel';
import { Folder, Inbox } from 'lucide-react';
import '../../styles/Panels.css';
import '../account/MySections.css';

const TABS = [
  { key: 'browse', label: 'My Materials', icon: Folder },
  { key: 'requests', label: 'Requests', icon: Inbox },
];

/**
 * Teacher's "Share Material" panel — a Semester -> Course -> Files tree the
 * teacher fully owns (separate from Personal Storage, no quota), plus an
 * inbox for section admins' requests to mirror one of these courses.
 */
const ShareMaterial = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [semester, setSemester] = useState(null);
  const [course, setCourse] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.key === tabParam) ? tabParam : 'browse';
  const setActiveTab = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', key);
      return next;
    }, { replace: true });
  };

  const refreshPendingCount = useCallback(async () => {
    try {
      const { data } = await api.get('/teacher-materials/mirror-requests');
      setPendingCount(data.length);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  return (
    <div>
      <div className="page-header">
        <h2>Share Material</h2>
        <p className="text-secondary">
          Organize files by semester and course, then let section CRs mirror a course into their section.
        </p>
      </div>

      <div className="cr-tool-row cr-tool-row-page">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`cr-tool-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <Icon size={15} /> {t.label}
              {t.key === 'requests' && pendingCount > 0 && (
                <span className="nav-badge" style={{ marginLeft: '0.4rem' }}>{pendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="cr-tool-content">
        {activeTab === 'browse' && (
          <>
            {!semester && (
              <FileExplorer
                endpoint="/teacher-materials"
                mode="folders"
                parentId={null}
                folderType="semester"
                onFolderClick={setSemester}
                title="Semesters"
              />
            )}

            {semester && !course && (
              <FileExplorer
                endpoint="/teacher-materials"
                mode="folders"
                parentId={semester._id}
                folderType="course"
                onFolderClick={setCourse}
                onBack={() => setSemester(null)}
                title={semester.name}
              />
            )}

            {semester && course && (
              <>
                <ActiveMirrorsPanel folderId={course._id} />
                <FileExplorer
                  endpoint="/teacher-materials"
                  mode="files"
                  folderId={course._id}
                  onBack={() => setCourse(null)}
                  title={`${semester.name} / ${course.name}`}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <MirrorRequestsInbox onCountChange={setPendingCount} />
        )}
      </div>
    </div>
  );
};

export default ShareMaterial;
