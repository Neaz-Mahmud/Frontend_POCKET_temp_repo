import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Folder as FolderIcon, FileText, Trash2, ArrowLeft, Download, Pencil, Search, FolderOpen, FileQuestion } from 'lucide-react';
import PresignedUploader from './PresignedUploader';
import './FileExplorer.css';

/**
 * Two modes:
 *  - mode="folders": lists sub-folders of `parentId` (null = root). Lets you
 *    create a new folder of `folderType` here, and navigate deeper via onFolderClick.
 *  - mode="files": lists files inside `folderId` (a course folder) and lets you upload.
 *
 * `endpoint` is the personal-storage base, e.g. "/personal".
 */
const FileExplorer = ({ endpoint, mode, parentId, folderType, folderId, onFolderClick, onBack, title, maxSize }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Search and Rename state
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchContents = async () => {
    setLoading(true);
    try {
      if (mode === 'folders') {
        const { data } = await api.get(`${endpoint}/folders`, { params: { parent: parentId } });
        setFolders(data);
        setFiles([]);
      } else {
        const { data } = await api.get(`${endpoint}/files`, { params: { folder: folderId } });
        setFiles(data);
        setFolders([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, parentId, folderId]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.post(`${endpoint}/folders`, {
        type: folderType,
        name: newFolderName,
        parentFolder: parentId,
      });
      setNewFolderName('');
      fetchContents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder and everything inside it?')) return;
    try {
      await api.delete(`${endpoint}/folders/${id}`);
      fetchContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`${endpoint}/files/${id}`);
      fetchContents();
    } catch (err) {
      console.error(err);
    }
  };

  const presign = async (file) => {
    const { data } = await api.post(`${endpoint}/files/presign`, {
      folderId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    });
    return { presignedUrl: data.presignedUrl, id: data.fileId };
  };

  const confirm = async (fileId) => {
    await api.post(`${endpoint}/files/confirm`, { fileId });
  };

  const startEdit = (id, currentName) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const handleRenameFolder = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    try {
      await api.patch(`${endpoint}/folders/${id}`, { name: editValue });
      setEditingId(null);
      fetchContents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename folder');
    }
  };

  const handleRenameFile = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    try {
      await api.patch(`${endpoint}/files/${id}`, { fileName: editValue });
      setEditingId(null);
      fetchContents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename file');
    }
  };

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter((f) => f.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="file-explorer card">
      <div className="explorer-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="btn-icon">
              <ArrowLeft size={19} />
            </button>
          )}
          <h3>{title}</h3>
        </div>

        {mode === 'folders' && (
          <form onSubmit={handleCreateFolder} className="create-folder-form">
            <input
              type="text"
              placeholder={`New ${folderType} name`}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Create</button>
          </form>
        )}
      </div>

      <div className="explorer-search">
        <span className="explorer-search-icon"><Search size={16} /></span>
        <input
          type="text"
          placeholder={`Search ${mode}…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={`Search ${mode}`}
        />
      </div>

      <div className={`explorer-grid ${mode === 'files' ? 'explorer-list' : ''}`}>
        {loading ? (
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : mode === 'folders' ? (
          filteredFolders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon"><FolderOpen size={22} /></span>
              <span className="empty-state-title">
                {searchQuery ? `No ${folderType} matches "${searchQuery}"` : `No ${folderType} folders yet`}
              </span>
              <span className="empty-state-hint">
                {searchQuery
                  ? 'Try a different search term.'
                  : `Create your first ${folderType} using the field above to start organising your files.`}
              </span>
            </div>
          ) : (
            filteredFolders.map((f) => (
              <div key={f._id} className="explorer-item folder-item" onClick={() => { if (editingId !== f._id && onFolderClick) { setSearchQuery(''); onFolderClick(f); } }}>
                <div className="item-icon folder-color">
                  <FolderIcon size={19} />
                </div>
                {editingId === f._id ? (
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => handleRenameFolder(f._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(f._id)}
                    style={{ flex: 1, padding: '2px 4px' }}
                  />
                ) : (
                  <span className="item-name" onDoubleClick={(e) => { e.stopPropagation(); startEdit(f._id, f.name); }}>{f.name}</span>
                )}
                <div className="item-actions">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(f._id, f.name); }} className="action-btn" title="Rename"><Pencil size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f._id); }} className="action-btn delete-btn">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><FileQuestion size={22} /></span>
            <span className="empty-state-title">
              {searchQuery ? `No files match "${searchQuery}"` : 'No files here yet'}
            </span>
            <span className="empty-state-hint">
              {searchQuery ? 'Try a different search term.' : 'Upload your first file using the panel below.'}
            </span>
          </div>
        ) : (
          filteredFiles.map((f) => (
            <div key={f._id} className="explorer-item file-item">
              <div className="item-icon file-color">
                <FileText size={19} />
              </div>
              <div className="item-details">
                {editingId === f._id ? (
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRenameFile(f._id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameFile(f._id)}
                    style={{ width: '100%', padding: '2px 4px' }}
                  />
                ) : (
                  <span className="item-name" title={f.fileName} onDoubleClick={() => startEdit(f._id, f.fileName)}>{f.fileName}</span>
                )}
                <span className="item-size">{(f.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="item-actions">
                <button onClick={() => startEdit(f._id, f.fileName)} className="action-btn" title="Rename"><Pencil size={15} /></button>
                <a href={f.downloadUrl} target="_blank" rel="noreferrer" className="action-btn download-btn">
                  <Download size={15} />
                </a>
                <button onClick={() => handleDeleteFile(f._id)} className="action-btn delete-btn">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {mode === 'files' && (
        <div className="upload-section">
          <h4>Upload File</h4>
          <PresignedUploader presign={presign} confirm={confirm} onUploadSuccess={fetchContents} maxSize={maxSize} />
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
