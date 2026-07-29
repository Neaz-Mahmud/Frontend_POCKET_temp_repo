import { useState, useEffect, useCallback } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../../api/axios';
import SectionSelect from '../../components/SectionSelect';
import Calendar from '../../components/Calendar';
import NoticeCard from '../../components/NoticeCard';
import '../../styles/Panels.css';

const StudentNotices = () => {
  const [section, setSection] = useState(null);
  const [notices, setNotices] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateNotices, setDateNotices] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    if (!section) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/sections/${section._id}/notices`);
      setNotices(data.notices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => { fetchNotices(); setSelectedDate(null); setDateNotices(null); }, [fetchNotices]);

  const fetchCalendar = async (month, year) => {
    if (!section) return;
    try {
      const { data } = await api.get(`/sections/${section._id}/notices/calendar`, { params: { month, year } });
      setMarks(data.map((d) => d.date));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (section) {
      const now = new Date();
      fetchCalendar(now.getMonth() + 1, now.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleSelectDate = async (dateStr) => {
    setSelectedDate(dateStr);
    try {
      const { data } = await api.get(`/sections/${section._id}/notices/date/${dateStr}`);
      setDateNotices(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Notices</h2>
        <p className="text-secondary">All notices from your Sections, and a calendar of upcoming dates</p>
      </div>

      <SectionSelect value={section} onChange={setSection} />

      {section && (
        <div className="two-col notices-two-col notices-two-col-calendar-left">
          <Calendar markedDates={marks} onMonthChange={fetchCalendar} onSelectDate={handleSelectDate} selectedDate={selectedDate} />

          <div>
            {selectedDate && dateNotices && (
              <div className="date-notices-block">
                <div className="date-notices-head">
                  <h4>Notices on {selectedDate}</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedDate(null); setDateNotices(null); }}>Clear</button>
                </div>
                <div className="notice-list">
                  {dateNotices.length === 0 ? (
                    <div className="empty-state">No notices on this date</div>
                  ) : (
                    dateNotices.map((n) => <NoticeCard key={n._id} notice={n} />)
                  )}
                </div>
                <hr className="divider" />
              </div>
            )}

            <h4 className="all-notices-heading">All Notices</h4>
            {loading ? (
              <div className="skeleton-list">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            ) : notices.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Megaphone size={22} /></span>
                <span className="empty-state-title">No notices yet</span>
                <span className="empty-state-hint">
                  When your CR posts a notice for this Section, it will appear here.
                </span>
              </div>
            ) : (
              <div className="notice-list">
                {notices.map((n) => <NoticeCard key={n._id} notice={n} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotices;
