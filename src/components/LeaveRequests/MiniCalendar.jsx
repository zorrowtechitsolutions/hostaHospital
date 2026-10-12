// src/components/leave/MiniCalendar.jsx
import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Fully functional mini calendar.
 *
 * Props:
 *   leaves: Array<{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', status: 'Approved'|'Pending'|'Rejected' }>
 *   initialDate?: Date  // starting month (defaults to TODAY)
 *   onDayClick?: (isoDate: string) => void
 */
const MiniCalendar = ({
  leaves = [],
  initialDate,       // if not passed, uses today's real month
  onDayClick,
}) => {
  // ✅ Use the real system date if no initialDate is provided
  const base = initialDate ? new Date(initialDate) : new Date();

  const [cursor, setCursor] = useState(
    new Date(base.getFullYear(), base.getMonth(), 1)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Build map: 'YYYY-MM-DD' -> status (priority: Rejected > Approved > Pending)
  const leaveMap = useMemo(() => {
    const map = {};
    const priority = { Rejected: 3, Approved: 2, Pending: 1 };

    leaves.forEach((leave) => {
      if (!leave.start) return;
      const start = new Date(leave.start);
      const end = leave.end ? new Date(leave.end) : start;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const incoming = leave.status || 'Pending';
        if (!map[key] || priority[incoming] > priority[map[key]]) {
          map[key] = incoming;
        }
      }
    });
    return map;
  }, [leaves]);

  // Grid layout
  const { blanks, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();     // 0 = Sun
    const lastDay = new Date(year, month + 1, 0).getDate(); // days in month
    return { blanks: firstDay, daysInMonth: lastDay };
  }, [year, month]);

  // ✅ Use the REAL today
  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const getDateStyle = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = leaveMap[key];

    if (status === 'Rejected') return 'bg-red-100 text-red-700 rounded-full';
    if (status === 'Approved') return 'bg-green-100 text-green-700 rounded-full';
    if (status === 'Pending')  return 'bg-blue-500 text-white rounded-full';
    if (isToday(day))          return 'ring-2 ring-blue-400 text-blue-600 rounded-full';
    return 'text-slate-600 hover:bg-slate-100 rounded-full';
  };

  const handleDayClick = (day) => {
    if (!onDayClick) return;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDayClick(key);
  };

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Leave Calendar</h3>
        <div className="flex gap-1">
          <button
            onClick={goPrev}
            className="p-1 hover:bg-slate-100 rounded"
            aria-label="Previous month"
          >
            <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
          </button>
          <button
            onClick={goNext}
            className="p-1 hover:bg-slate-100 rounded"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Month/Year */}
      <div className="text-center font-medium text-sm text-gray-800 mb-4">
        {MONTHS[month]} {year}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
        {DAYS.map((d) => (
          <div key={d} className="text-slate-400 font-medium mb-1">
            {d}
          </div>
        ))}

        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`w-6 h-6 mx-auto flex items-center justify-center cursor-pointer text-xs ${getDateStyle(day)}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 text-[10px] text-slate-500 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pending
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> Approved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Rejected
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;