import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/**
 * markedDates: array of 'YYYY-MM-DD' strings (dates that should be red-marked)
 * onMonthChange(month 1-12, year)
 * onSelectDate(dateStr)
 * selectedDate: 'YYYY-MM-DD' | null
 */
const Calendar = ({ markedDates = [], onMonthChange, onSelectDate, selectedDate }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [year, setYear] = useState(today.getFullYear());

  const markedSet = new Set(markedDates);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
    if (onMonthChange) onMonthChange(m, y);
  };

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d) => `${year}-${pad(month)}-${pad(d)}`;
  const isToday = (d) => d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="calendar card">
      <div className="calendar-header">
        <button className="btn-icon" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
        <h3>{MONTH_NAMES[month - 1]} {year}</h3>
        <button className="btn-icon" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
      </div>

      <div className="calendar-grid calendar-daynames">
        {DAY_NAMES.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="calendar-grid">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} className="calendar-cell empty" />;
          const ds = dateStr(d);
          const marked = markedSet.has(ds);
          const selected = ds === selectedDate;
          return (
            <button
              key={ds}
              className={`calendar-cell ${marked ? 'marked' : ''} ${selected ? 'selected' : ''} ${isToday(d) ? 'today' : ''}`}
              onClick={() => marked && onSelectDate && onSelectDate(ds)}
              disabled={!marked}
            >
              {d}
              {marked && <span className="calendar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
