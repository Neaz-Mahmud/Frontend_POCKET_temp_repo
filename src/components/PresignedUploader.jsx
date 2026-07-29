import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import './PresignedUploader.css';

/**
 * Generic presigned-upload widget.
 * Props:
 *  - presign(file): async () => { presignedUrl, id }  -- id is fileId or materialId
 *  - confirm(id): async () => any
 *  - onUploadSuccess()
 *  - maxSize (bytes, optional)
 */
const PresignedUploader = ({ presign, confirm, onUploadSuccess, maxSize }) => {
  const [uploads, setUploads] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    const newUploads = selectedFiles.map((file) => {
      let error = '';
      if (maxSize && file.size > maxSize) {
        error = `Size limit exceeded (${(maxSize / (1024 * 1024)).toFixed(1)} MB)`;
      }
      return { file, progress: 0, error, status: error ? 'error' : 'pending' };
    });

    setUploads((prev) => [...prev, ...newUploads]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeUpload = (index) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    const pendingIndexes = uploads
      .map((u, i) => (u.status === 'pending' || u.status === 'error' ? i : -1))
      .filter((i) => i !== -1 && !uploads[i].error); // don't try to upload ones with initial size errors

    for (let index of pendingIndexes) {
      setUploads((prev) => prev.map((u, i) => i === index ? { ...u, status: 'uploading', progress: 0, error: '' } : u));
      
      const target = uploads[index];
      
      try {
        const { presignedUrl, id } = await presign(target.file);

        await axios.put(presignedUrl, target.file, {
          headers: { 'Content-Type': target.file.type || 'application/octet-stream' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploads((prev) => prev.map((u, i) => i === index ? { ...u, progress: percentCompleted } : u));
          },
        });

        await confirm(id);

        setUploads((prev) => prev.map((u, i) => i === index ? { ...u, status: 'done', progress: 100 } : u));
        if (onUploadSuccess) onUploadSuccess();
      } catch (err) {
        console.error(err);
        let errorMsg = err.response?.data?.message || 'Upload failed';
        if (err.response?.data?.code === 'QUOTA_EXCEEDED') {
          errorMsg = err.response.data.message;
        }
        setUploads((prev) => prev.map((u, i) => i === index ? { ...u, status: 'error', error: errorMsg } : u));
      }
    }
  };

  const hasPending = uploads.some((u) => u.status === 'pending' || (u.status === 'error' && u.progress < 100 && !u.error.includes('limit')));
  const isUploading = uploads.some((u) => u.status === 'uploading');

  return (
    <div className="uploader-container">
      <div className="upload-box">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          className="file-input-hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-label">
          <span className="upload-icon"><Upload size={22} /></span>
          <span>Select files to upload</span>
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="uploads-list">
          {uploads.map((u, index) => (
            <div key={index} className="selected-file">
              <div className="selected-file-row">
                <div className="file-info">
                  <span className="file-name">{u.file.name}</span>
                  <span className="file-size text-secondary">({(u.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                {u.status !== 'uploading' && u.status !== 'done' && (
                  <button className="clear-btn" onClick={() => removeUpload(index)}>
                    <X size={17} />
                  </button>
                )}
                {u.status === 'done' && <span className="upload-done-label">Done</span>}
              </div>

              {u.error && <div className="upload-error">{u.error}</div>}

              {(u.status === 'uploading' || (u.status === 'done' && !u.error)) && (
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasPending && !isUploading && (
        <button className="btn btn-primary upload-btn" onClick={handleUploadAll}>
          Upload {uploads.filter(u => u.status === 'pending' || u.status === 'error').length} Files
        </button>
      )}
    </div>
  );
};

export default PresignedUploader;
