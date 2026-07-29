import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import NoticeCard from '../../components/NoticeCard';
import '../../styles/Panels.css';

const TeacherNotices = () => {
  const [notices, setNotices] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notices/mine');
      setNotices(data.notices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async (month, year) => {
    try {
      const { data } = await api.get('/notices/mine/calendar', { params: { month, year } });
      setMarks(data.map((d) => d.date));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
    const now = new Date();
    fetchCalendar(now.getMonth() + 1, now.getFullYear());
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Notices</h2>
        <p className="text-secondary">Notices where an admin has mentioned you, across all your Sections</p>
      </div>

      <div className="two-col">
        <div>
          <div className="notices-list-head">
            <h4>{selectedDate ? `Notices on ${selectedDate}` : 'Mentioning you'}</h4>
            {selectedDate && <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>Show all</button>}
          </div>
          {loading ? (
            <div className="loading-row"><span className="spinner" /> Loading…</div>
          ) : (
            (() => {
              const list = selectedDate
                ? notices.filter((n) => n.occurrenceDate && n.occurrenceDate.slice(0, 10) === selectedDate)
                : notices;
              if (list.length === 0) return <div className="empty-state">No notices to show</div>;
              return (
                <div className="notice-list">
                  {list.map((n) => <NoticeCard key={n._id} notice={n} showSection />)}
                </div>
              );
            })()
          )}
        </div>

        <Calendar markedDates={marks} onMonthChange={fetchCalendar} onSelectDate={setSelectedDate} selectedDate={selectedDate} />
      </div>
    </div>
  );
};

export default TeacherNotices;
