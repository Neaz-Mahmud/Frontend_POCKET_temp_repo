import { useState } from 'react';
import api from '../api/axios';

const RequestAdminForm = ({ onComplete }) => {
  const [reqId, setReqId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [reqMsg, setReqMsg] = useState(null);

  const handleRequestAdmin = async (e) => {
    e.preventDefault();
    setReqMsg(null);
    setRequesting(true);
    try {
      const { data: section } = await api.get('/sections/lookup', { params: { uniqueId: reqId } });
      await api.post(`/sections/${section._id}/join-requests`, { role: 'admin' });
      setReqMsg({ type: 'success', text: `Admin request sent to "${section.name}".` });
      setReqId('');
      if (onComplete) onComplete();
    } catch (err) {
      setReqMsg({ type: 'error', text: err.response?.data?.message || 'Could not send admin request' });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      {reqMsg && <div className={`alert alert-${reqMsg.type}`}>{reqMsg.text}</div>}
      <form onSubmit={handleRequestAdmin} className="inline-form">
        <input
          placeholder="e.g. 2026-VU-CSE-8B-A"
          value={reqId}
          onChange={(e) => setReqId(e.target.value)}
          required
        />
        <button className="btn btn-primary" disabled={requesting}>
          {requesting ? 'Sending…' : 'Request Admin'}
        </button>
      </form>
    </>
  );
};

export default RequestAdminForm;
