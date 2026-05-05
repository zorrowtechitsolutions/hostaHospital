// src/components/Appointment/VisitCalendar.jsx - Refactored
import React, { useState } from "react";
import { Button, Card, Badge } from "../ui";

const VisitCalendar = ({ visitedDates = [], onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); if (onDateSelect) onDateSelect(new Date()); };

  const isVisitedDate = (date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return visitedDates.includes(dateString);
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
      if (onDateSelect) onDateSelect(date);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="p-1">←</Button>
        <h4 className="text-md font-semibold text-gray-800">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
        <Button variant="ghost" size="sm" onClick={goToNextMonth} className="p-1">→</Button>
      </div>

      <div className="flex justify-end mb-3">
        <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-[#1C62A0]">Today</Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isVisited = date && isVisitedDate(date);
          const isSelected = date && isSelectedDate(date);
          const today = date && isToday(date);
          return (
            <div key={index} onClick={() => handleDateClick(date)} className={`relative aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all ${!date ? 'invisible' : ''} ${isSelected ? 'bg-[#1C62A0] text-white ring-2 ring-[#1C62A0] ring-offset-1' : 'hover:bg-gray-100'} ${isVisited && !isSelected ? 'bg-green-100 hover:bg-green-200' : ''} ${today && !isSelected ? 'ring-2 ring-[#1C62A0] ring-offset-1' : ''}`}>
              <span className={`text-sm ${isSelected ? 'text-white font-semibold' : 'text-gray-700'}`}>{date ? date.getDate() : ''}</span>
              {isVisited && !isSelected && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div></div>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 rounded"></div><span className="text-gray-600">Visited Date</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 ring-2 ring-[#1C62A0] ring-offset-1 rounded"></div><span className="text-gray-600">Today</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1C62A0] rounded"></div><span className="text-gray-600">Selected Date</span></div>
      </div>
    </Card>
  );
};

export default VisitCalendar;