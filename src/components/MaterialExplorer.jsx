import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Folder as FolderIcon, FileText, Trash2, ArrowLeft, Download, Share2, Pencil, Search, FolderOpen, FileQuestion } from 'lucide-react';
import PresignedUploader from './PresignedUploader';
import MirrorRequestPanel from './MirrorRequestPanel';
import './FileExplorer.css';

/**
 * Section content browser (Semester -> Course -> Material).
 * Read-only for regular members; when `canManage` is true, adds create/delete/upload controls.
 */
const MaterialExplorer = ({ sectionId, canManage = false }) => {
  const [semester, setSemester] = useState(null);
  const [course, setCourse] = useState(null);

  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  // Search and Rename state
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const base = `/sections/${sectionId}`;

  const fetchLevel = async () => {
    setLoading(true);
    try {
      if (!semester) {
        const { data } = await api.get(`${base}/semesters`);
        setSemesters(data);
      } else if (!course) {
        const { data } = await api.get(`${base}/semesters/${semester._id}/courses`);
        setCourses(data);
      } else {
        const { data } = await api.get(`${base}/courses/${course._id}/materials`);
        setMaterials(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, semester, course]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      if (!semester) {
        await api.post(`${base}/semesters`, { name: newName });
      } else {
        await api.post(`${base}/semesters/${semester._id}/courses`, { name: newName });
      }
      setNewName('');
      fetchLevel();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm('Delete this semester and everything inside it?')) return;
    await api.delete(`${base}/semesters/${id}`);
    fetchLevel();
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course and its materials?')) return;
    await api.delete(`${base}/semesters/${semester._id}/courses/${id}`);
    fetchLevel();
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    await api.delete(`${base}/courses/${course._id}/materials/${id}`);
    fetchLevel();
  };

  const presign = async (file) => {
    const { data } = await api.post(`${base}/courses/${course._id}/materials/presign`, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    });
    return { presignedUrl: data.presignedUrl, id: data.materialId };
  };

  const confirmUpload = async (materialId) => {
    await api.post(`${base}/courses/${course._id}/materials/confirm`, { materialId });
  };

  const startEdit = (id, currentName) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleRenameSemester = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    try {
      await api.patch(`${base}/semesters/${id}`, { name: editValue });
      setEditingId(null);
      fetchLevel();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename semester');
    }
  };

  const handleRenameCourse = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    try {
      await api.patch(`${base}/semesters/${semester._id}/courses/${id}`, { name: editValue });
      setEditingId(null);
      fetchLevel();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename course');
    }
  };

  const handleRenameMaterial = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    try {
      await api.patch(`${base}/courses/${course._id}/materials/${id}`, { fileName: editValue });
      setEditingId(null);
      fetchLevel();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename material');
    }
  };

  const filteredSemesters = semesters.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCourses = courses.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMaterials = materials.filter((m) => m.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

  const title = !semester ? 'Semesters' : !course ? semester.name : `${semester.name} / ${course.name}`;
  const onBack = !semester ? undefined : !course ? () => { setSemester(null); setSearchQuery(''); } : () => { setCourse(null); setSearchQuery(''); };

  return (
    <div className="file-explorer card">
      <div className="explorer-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="btn-icon"><ArrowLeft size={19} /></button>
          )}
          <h3>{title}</h3>
        </div>

        {canManage && !course && (
          <form onSubmit={handleCreate} className="create-folder-form">
            <input
              type="text"
              placeholder={!semester ? 'New semester name' : 'New course name'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Create</button>
          </form>
        )}
      </div>

      <div className="explorer-search">
        <span className="explorer-search-icon"><Search size={16} /></span>
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search materials"
        />
      </div>

      {canManage && course && (
        <MirrorRequestPanel sectionId={sectionId} courseId={course._id} onLinked={fetchLevel} />
      )}

      <div className={`explorer-grid ${semester && course ? 'explorer-list' : ''}`}>
        {loading ? (
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : !semester ? (
          filteredSemesters.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FolderOpen size={22} /></span>
              <span className="empty-state-title">
                {searchQuery ? `No semesters match "${searchQuery}"` : 'No semesters yet'}
              </span>
              <span className="empty-state-hint">
                {searchQuery
                  ? 'Try a different search term.'
                  : canManage
                    ? 'Add a semester above to start organising this Section’s materials.'
                    : 'Your section admin hasn’t added any semesters yet.'}
              </span>
            </div>
          ) : (
            filteredSemesters.map((s) => (
              <div key={s._id} className="explorer-item folder-item" onClick={() => { if (editingId !== s._id) { setSearchQuery(''); setSemester(s); } }}>
                <div className="item-icon folder-color"><FolderIcon size={19} /></div>
                {editingId === s._id ? (
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => handleRenameSemester(s._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSemester(s._id)}
                    style={{ flex: 1, padding: '2px 4px' }}
                  />
                ) : (
                  <span className="item-name" onDoubleClick={(e) => { if (canManage) { e.stopPropagation(); startEdit(s._id, s.name); } }}>{s.name}</span>
                )}
                {canManage && (
                  <div className="item-actions">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(s._id, s.name); }} className="action-btn" title="Rename"><Pencil size={15} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSemester(s._id); }} className="action-btn delete-btn">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        ) : !course ? (
          filteredCourses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FolderOpen size={22} /></span>
              <span className="empty-state-title">
                {searchQuery ? `No courses match "${searchQuery}"` : 'No courses in this semester'}
              </span>
              <span className="empty-state-hint">
                {searchQuery
                  ? 'Try a different search term.'
                  : canManage
                    ? 'Add a course above to start uploading materials for it.'
                    : 'Your section admin hasn’t added any courses here yet.'}
              </span>
            </div>
          ) : (
            filteredCourses.map((c) => (
              <div key={c._id} className="explorer-item folder-item" onClick={() => { if (editingId !== c._id) { setSearchQuery(''); setCourse(c); } }}>
                <div className="item-icon folder-color"><FolderIcon size={19} /></div>
                {editingId === c._id ? (
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => handleRenameCourse(c._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameCourse(c._id)}
                    style={{ flex: 1, padding: '2px 4px' }}
                  />
                ) : (
                  <span className="item-name" onDoubleClick={(e) => { if (canManage) { e.stopPropagation(); startEdit(c._id, c.name); } }}>{c.name}</span>
                )}
                {canManage && (
                  <div className="item-actions">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(c._id, c.name); }} className="action-btn" title="Rename"><Pencil size={15} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c._id); }} className="action-btn delete-btn">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        ) : filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><FileQuestion size={22} /></span>
            <span className="empty-state-title">
              {searchQuery ? `No materials match "${searchQuery}"` : 'No materials in this course'}
            </span>
            <span className="empty-state-hint">
              {searchQuery
                ? 'Try a different search term.'
                : canManage
                  ? 'Upload the first material using the panel below.'
                  : 'Check back once your section admin uploads something here.'}
            </span>
          </div>
        ) : (
          filteredMaterials.map((m) => (
            <div key={m._id} className="explorer-item file-item">
              <div className="item-icon file-color"><FileText size={19} /></div>
              <div className="item-details">
                {editingId === m._id && !m.mirroredFrom ? (
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRenameMaterial(m._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameMaterial(m._id)}
                    style={{ width: '100%', padding: '2px 4px' }}
                  />
                ) : (
                  <span className="item-name" title={m.fileName} onDoubleClick={() => { if (canManage && !m.mirroredFrom) startEdit(m._id, m.fileName); }}>
                    {m.fileName} {m.mirroredFrom && <Share2 size={12} title="Mirrored from teacher" style={{ verticalAlign: 'middle', marginLeft: '0.25rem', opacity: 0.6 }} />}
                  </span>
                )}
                <span className="item-size">{(m.fileSize / 1024 / 1024).toFixed(2)} MB · {m.uploadedBy?.name || 'admin'}</span>
              </div>
              <div className="item-actions">
                {canManage && !m.mirroredFrom && (
                  <button onClick={() => startEdit(m._id, m.fileName)} className="action-btn" title="Rename"><Pencil size={15} /></button>
                )}
                <a href={m.downloadUrl} target="_blank" rel="noreferrer" className="action-btn download-btn">
                  <Download size={15} />
                </a>
                {canManage && (
                  <button onClick={() => handleDeleteMaterial(m._id)} className="action-btn delete-btn">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {canManage && course && (
        <div className="upload-section">
          <h4>Upload Material</h4>
          <PresignedUploader presign={presign} confirm={confirmUpload} onUploadSuccess={fetchLevel} />
        </div>
      )}
    </div>
  );
};

export default MaterialExplorer;
