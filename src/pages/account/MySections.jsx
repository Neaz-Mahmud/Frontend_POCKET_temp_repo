import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown,
  ChevronRight,
  LogIn,
  ShieldPlus,
  Megaphone,
  ArrowRight,
  LogOut,
  Check,
  X,
  Users,
} from 'lucide-react';
import RequestAdminForm from '../../components/RequestAdminForm';
import { identityStyle } from '../../utils/identityColor';
import '../../styles/Panels.css';
import './MySections.css';

const ROLE_BADGE = { admin: 'badge-ink', teacher: 'badge-sky', student: 'badge-mint' };

/**
 * One page for everything Section-related.
 *
 * Students only ever see "Join a Section" here — that's the one action that
 * applies to every student. Creating a Section or requesting CR/admin rights
 * is a different job entirely (it's what a Class Representative does, not
 * a regular student), so for students those two actions live on a separate,
 * clearly-labelled CR Tools page instead of sitting inline where a normal
 * student would have to wonder "is this for me?". A small callout card below
 * links there for anyone who actually needs it.
 *
 * Teachers can genuinely need all three actions day-to-day (a teacher may
 * run several Sections), so their view keeps everything inline as before.
 *
 * Either way: a flat list of every Section you belong to, and if you're an
 * admin (CR) of a Section, its card links to a dedicated page (/sections/:id)
 * with full room for Members / Notices / Materials.
 */
const MySections = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openAction, setOpenAction] = useState(null); // 'join' | 'create' | 'requestAdmin' | null

  // join form
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  const basePath = isTeacher ? '/teacher/sections' : '/student/sections';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: sectionData }, { data: notifData }] = await Promise.all([
        api.get('/sections/my'),
        api.get('/notifications'),
      ]);

      const unreadMap = {};
      notifData.forEach(n => {
        if (!n.read && n.section) {
          unreadMap[n.section] = (unreadMap[n.section] || 0) + 1;
        }
      });

      const sectionsWithCounts = sectionData.map(s => ({
        ...s,
        unreadCount: unreadMap[s._id] || 0
      }));
      
      setSections(sectionsWithCounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAction = (key) => {
    setOpenAction((cur) => (cur === key ? null : key));
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinMsg(null);
    setJoining(true);
    try {
      const { data: section } = await api.get('/sections/lookup', { params: { uniqueId: joinId } });
      await api.post(`/sections/${section._id}/join-requests`, { role: user.role });
      setJoinMsg({ type: 'success', text: `Request sent to "${section.name}" — waiting for an admin to approve.` });
      setJoinId('');
    } catch (err) {
      setJoinMsg({ type: 'error', text: err.response?.data?.message || 'Could not send join request' });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (e, sectionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to leave this section?')) return;
    try {
      await api.delete(`/sections/${sectionId}/members/${user._id}`);
      setSections((prev) => prev.filter((s) => s._id !== sectionId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to leave section');
    }
  };

  const handleDecision = async (e, sectionId, decision) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/sections/${sectionId}/invitations/decide`, { decision });
      if (decision === 'accept') {
        setSections(prev => prev.map(s => s._id === sectionId ? { ...s, status: 'active' } : s));
      } else {
        setSections(prev => prev.filter(s => s._id !== sectionId));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to process invitation');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>My Sections</h2>
        <p className="text-secondary">
          {isTeacher
            ? "Join a Section, or manage the ones you're a CR/admin for"
            : 'Join a Section to see its notices and materials'}
        </p>
      </div>

      {/* Always-visible quick actions — no accordions to miss.
          Students only get "Join" here; Create/Request Admin are CR-specific
          and live on a separate CR Tools page (see callout card below) so a
          regular student never has to wonder whether those options are meant
          for them. Teachers keep all three inline since they use them regularly. */}
      <div className="quick-actions">
        <button className={`quick-action-btn ${openAction === 'join' ? 'active' : ''}`} onClick={() => toggleAction('join')}>
          <LogIn size={16} /> Join a Section
          <ChevronDown size={15} className="chev" />
        </button>
        {isTeacher && (
          <button className={`quick-action-btn ${openAction === 'requestAdmin' ? 'active' : ''}`} onClick={() => toggleAction('requestAdmin')}>
            <ShieldPlus size={16} /> Request Admin Access
            <ChevronDown size={15} className="chev" />
          </button>
        )}
      </div>

      {openAction === 'join' && (
        <div className="card action-panel">
          <p className="text-secondary action-panel-hint">
            Enter the Section's join code. An admin will need to approve your request before it appears below.
          </p>
          {joinMsg && <div className={`alert alert-${joinMsg.type}`}>{joinMsg.text}</div>}
          <form onSubmit={handleJoin} className="inline-form">
            <input
              placeholder="e.g. 2026-VU-CSE-8B-A"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              required
            />
            <button className="btn btn-primary" disabled={joining}>{joining ? 'Sending…' : 'Request to Join'}</button>
          </form>
        </div>
      )}



      {isTeacher && openAction === 'requestAdmin' && (
        <div className="card action-panel">
          <p className="text-secondary action-panel-hint">
            Already a member and want admin rights for that Section? Enter its join code.
          </p>
          <RequestAdminForm />
        </div>
      )}

      {!isTeacher && (
        <Link to="/student/cr-tools" className="cr-tools-callout">
          <div className="cr-tools-callout-icon"><Megaphone size={18} /></div>
          <div className="cr-tools-callout-text">
            <div className="cr-tools-callout-title">Are you a Class Representative?</div>
            <div className="cr-tools-callout-sub">Create a Section or request CR/admin access from a dedicated page</div>
          </div>
          <ArrowRight size={17} className="cr-tools-callout-arrow" />
        </Link>
      )}

      <h4 className="section-list-heading">Your Sections</h4>

      {loading ? (
        <div className="skeleton-list">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : sections.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><Users size={22} /></span>
          <span className="empty-state-title">No Sections yet</span>
          <span className="empty-state-hint">
            Use “Join a Section” above and enter the code your CR shared with you.
          </span>
        </div>
      ) : (
        <div className="section-card-list">
          {sections.map((s) => {
            if (s.status === 'invited') {
              return (
                <div key={s._id} className="section-card is-invited">
                  <div className="section-card-header section-card-header-static">
                    <div className="member-avatar" style={identityStyle(s._id)}>{s.name.charAt(0).toUpperCase()}</div>
                    <div className="member-info">
                      <div className="member-name">{s.name}</div>
                      <div className="member-sub">Invitation to join as {s.memberRole}</div>
                    </div>
                    <div className="section-invite-actions">
                      <button className="btn btn-primary btn-sm" onClick={(e) => handleDecision(e, s._id, 'accept')}>
                        <Check size={14} /> Accept
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => handleDecision(e, s._id, 'reject')}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const isAdmin = s.memberRole === 'admin';
            return isAdmin ? (
              <Link key={s._id} to={`${basePath}/${s._id}`} state={{ section: s }} className="section-card section-card-link">
                <div className="section-card-header">
                  <div className="member-avatar" style={identityStyle(s._id)}>{s.name.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <div className="member-name">{s.name}</div>
                    <div className="member-sub">{s.uniqueId}</div>
                  </div>
                  <div className="section-card-meta">
                    {s.unreadCount > 0 && (
                      <span className="badge badge-butter">{s.unreadCount} new</span>
                    )}
                    <span className={`badge ${ROLE_BADGE[s.memberRole]}`}>{s.memberRole}</span>
                    <button
                      className="btn btn-ghost btn-sm section-card-leave"
                      onClick={(e) => handleLeave(e, s._id)}
                      title="Leave Section"
                      aria-label={`Leave ${s.name}`}
                    >
                      <LogOut size={16} />
                    </button>
                    <ChevronRight size={18} className="section-card-chevron" />
                  </div>
                </div>
              </Link>
            ) : (
              <div key={s._id} className="section-card">
                <div className="section-card-header section-card-header-static">
                  <div className="member-avatar" style={identityStyle(s._id)}>{s.name.charAt(0).toUpperCase()}</div>
                  <div className="member-info">
                    <div className="member-name">{s.name}</div>
                    <div className="member-sub">{s.uniqueId}</div>
                  </div>
                  <div className="section-card-meta">
                    {s.unreadCount > 0 && (
                      <span className="badge badge-butter">{s.unreadCount} new</span>
                    )}
                    <span className={`badge ${ROLE_BADGE[s.memberRole]}`}>{s.memberRole}</span>
                    <button
                      className="btn btn-ghost btn-sm section-card-leave"
                      onClick={(e) => handleLeave(e, s._id)}
                      title="Leave Section"
                      aria-label={`Leave ${s.name}`}
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySections;
