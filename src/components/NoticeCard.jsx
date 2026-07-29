import { Calendar as CalIcon, User } from 'lucide-react';

const TYPE_BADGE = {
  general: 'badge-sky',
  ct: 'badge-rose',
  assignment: 'badge-mint',
  labtest: 'badge-peach',
  custom: 'badge-lavender',
};

/* The leading colour rail on the card picks up the same hue as the
   type badge, so a list of notices is scannable by category. */
const TYPE_ACCENT = {
  general: 'var(--pastel-sky-ink)',
  ct: 'var(--pastel-rose-ink)',
  assignment: 'var(--pastel-mint-ink)',
  labtest: 'var(--pastel-peach-ink)',
  custom: 'var(--pastel-lavender-ink)',
};

const NoticeCard = ({ notice, showSection = false, canManage = false, onEdit, onDelete }) => {
  return (
    <div
      className="notice-card panel-flat"
      style={{ '--notice-accent': TYPE_ACCENT[notice.type] || 'var(--pastel-lavender-ink)' }}
    >
      <div className="notice-card-top">
        <span className={`badge ${TYPE_BADGE[notice.type] || 'badge-lavender'}`}>{notice.type}</span>
        {showSection && notice.section?.name && (
          <span className="badge badge-ink">{notice.section.name}</span>
        )}
        {notice.occurrenceDate && (
          <span className="notice-date"><CalIcon size={13} /> {new Date(notice.occurrenceDate).toLocaleDateString()}</span>
        )}
      </div>
      <h4 className="notice-title">{notice.title}</h4>
      {notice.description && <p className="notice-desc">{notice.description}</p>}
      <div className="notice-card-bottom">
        <span className="notice-meta"><User size={13} /> {notice.postedBy?.name || 'Admin'}</span>
        {notice.mentionedTeachers?.length > 0 && (
          <span className="notice-meta">Mentions: {notice.mentionedTeachers.map((t) => t.name).join(', ')}</span>
        )}
        {canManage && (
          <div className="notice-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(notice)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(notice._id)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeCard;
