import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Bell, Check, ArrowRight } from 'lucide-react';
import '../../styles/Panels.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      
      // Auto-mark as read in the backend so the red circle disappears,
      // but keep local state as-is so the user still sees which ones are new this session.
      const hasUnread = data.some(n => !n.read);
      if (hasUnread) {
        api.patch('/notifications/read-all').then(() => {
          window.dispatchEvent(new Event('refreshBadges'));
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      // Background poll without showing loading state
      api.get('/notifications').then(({ data }) => setNotifications(data)).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('refreshBadges'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications(prev => prev.map(n => 
          n._id === notification._id ? { ...n, read: true } : n
        ));
        window.dispatchEvent(new Event('refreshBadges'));
      } catch (err) {
        console.error(err);
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h2>Notifications</h2>
          <p className="text-secondary">{unreadCount > 0 ? `${unreadCount} unread` : 'Stay updated with your sections'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <Check size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="skeleton-list">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><Bell size={22} /></span>
          <span className="empty-state-title">You're all caught up</span>
          <span className="empty-state-hint">
            Notices, invitations and section activity will show up here as they happen.
          </span>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`card notification-row ${n.link ? 'is-clickable' : ''} ${!n.read ? 'is-unread' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time text-secondary">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {n.link && <ArrowRight size={16} className="text-secondary" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
