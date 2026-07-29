import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Plus, ShieldPlus, Megaphone } from 'lucide-react';
import RequestAdminForm from '../../components/RequestAdminForm';
import '../../styles/Panels.css';
import './MySections.css';

/**
 * A separate, clearly-labelled home for the two actions that only apply to
 * Class Representatives: creating a new Section, and requesting CR/admin
 * rights on an existing one. Pulled out of the main "My Sections" page so a
 * regular student browsing their sections never sees an option that isn't
 * meant for them — this page exists specifically so those tools have
 * somewhere unambiguous to live.
 */
const CrTools = () => {
  const [tab, setTab] = useState('create'); // 'create' | 'requestAdmin'

  // create form
  const [createData, setCreateData] = useState({ name: '', uniqueId: '', contactPhone: '' });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateMsg(null);
    setCreating(true);
    try {
      const { data } = await api.post('/sections', createData);
      setCreateMsg({ type: 'success', text: `"${data.name}" created — you're the admin. Find it under My Sections.` });
      setCreateData({ name: '', uniqueId: '', contactPhone: '' });
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create section' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <Link to="/student/sections" className="btn btn-ghost btn-sm section-admin-back">
        <ArrowLeft size={16} /> Back to My Sections
      </Link>

      <div className="page-header">
        <h2>CR Tools</h2>
        <p className="text-secondary">For Class Representatives only — not needed for everyday use of the platform</p>
      </div>

      <div className="alert alert-info cr-tools-banner">
        <Megaphone size={17} />
        <span>
          These tools are for setting up a new Section or becoming its CR/admin. If you're just here to view notices
          and materials for a class you're already part of, head back to My Sections instead.
        </span>
      </div>

      <div className="cr-tool-row">
        <button className={`cr-tool-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
          <Plus size={15} /> Create a Section
        </button>
        <button className={`cr-tool-btn ${tab === 'requestAdmin' ? 'active' : ''}`} onClick={() => setTab('requestAdmin')}>
          <ShieldPlus size={15} /> Request Admin Access
        </button>
      </div>

      {tab === 'create' && (
        <div className="card action-panel">
          <p className="text-secondary action-panel-hint">
            Setting up a brand-new Section for your class? You'll automatically become its admin (CR).
          </p>
          {createMsg && <div className={`alert alert-${createMsg.type}`}>{createMsg.text}</div>}
          <form onSubmit={handleCreate} className="stacked-form">
            <input
              placeholder="Section name (e.g. CSE-8B, Physics 101)"
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              required
            />
            <input
              placeholder="Unique join code (e.g. 2026-VU-CSE-8B-A)"
              value={createData.uniqueId}
              onChange={(e) => setCreateData({ ...createData, uniqueId: e.target.value })}
              required
            />
            <input
              placeholder="Contact phone"
              value={createData.contactPhone}
              onChange={(e) => setCreateData({ ...createData, contactPhone: e.target.value })}
              required
            />
            <button className="btn btn-primary" disabled={creating} style={{ alignSelf: 'flex-start' }}>
              {creating ? 'Creating…' : 'Create Section'}
            </button>
          </form>
        </div>
      )}

      {tab === 'requestAdmin' && (
        <div className="card action-panel">
          <p className="text-secondary action-panel-hint">
            Already a member of a Section and want CR/admin rights for it? Enter its join code below.
          </p>
          <RequestAdminForm />
        </div>
      )}
    </div>
  );
};

export default CrTools;
