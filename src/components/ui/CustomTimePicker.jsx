
import React, { useEffect, useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

const CustomTimePicker = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Select time',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  // Convert 24-hour value to 12-hour display
  useEffect(() => {
    if (!value) return;

    const [h, m] = value.split(':');
    const hour24 = Number(h);

    setHour(String(hour24 % 12 || 12).padStart(2, '0'));
    setMinute(m || '00');
    setPeriod(hour24 >= 12 ? 'PM' : 'AM');
  }, [value]);

  // Convert selected time to 24-hour format
  const updateTime = (h, m, p) => {
    let hour24 = Number(h) % 12;

    if (p === 'PM') {
      hour24 += 12;
    }

    const formattedTime =
      `${String(hour24).padStart(2, '0')}:${m}`;

    onChange?.(formattedTime);
  };

  const handleChange = (type, newValue) => {
    const newHour = type === 'hour' ? newValue : hour;
    const newMinute = type === 'minute' ? newValue : minute;
    const newPeriod = type === 'period' ? newValue : period;

    if (type === 'hour') setHour(newValue);
    if (type === 'minute') setMinute(newValue);
    if (type === 'period') setPeriod(newValue);

    updateTime(newHour, newMinute, newPeriod);
  };

  const displayValue = value
    ? `${hour}:${minute} ${period}`
    : '';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Time Input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-4 border rounded-lg
          text-sm bg-white flex items-center justify-between
          outline-none transition-all
          focus:ring-2 focus:ring-[#1C62A0]
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50'
              : 'cursor-pointer border-gray-200 hover:border-gray-300'
          }`}
      >
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>

        <Clock size={17} className="text-gray-400" />
      </button>

      {/* Time Picker Popup */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 top-full mt-2 z-50
            w-full min-w-[240px] bg-white border border-gray-200
            rounded-xl shadow-xl p-4">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Select Time
              </h3>
              <Clock size={17} className="text-[#1C62A0]" />
            </div>

            <div className="grid grid-cols-3 gap-2">

              {/* Hour */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Hour
                </label>

                <select
                  value={hour}
                  onChange={(e) =>
                    handleChange('hour', e.target.value)
                  }
                  className="w-full h-10 px-2 border border-gray-200
                    rounded-lg text-sm outline-none
                    focus:border-[#1C62A0]"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const h = String(i + 1).padStart(2, '0');

                    return (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Minute */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Minute
                </label>

                <select
                  value={minute}
                  onChange={(e) =>
                    handleChange('minute', e.target.value)
                  }
                  className="w-full h-10 px-2 border border-gray-200
                    rounded-lg text-sm outline-none
                    focus:border-[#1C62A0]"
                >
                  {Array.from({ length: 60 }, (_, i) => {
                    const m = String(i).padStart(2, '0');

                    return (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* AM / PM */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Period
                </label>

                <select
                  value={period}
                  onChange={(e) =>
                    handleChange('period', e.target.value)
                  }
                  className="w-full h-10 px-2 border border-gray-200
                    rounded-lg text-sm outline-none
                    focus:border-[#1C62A0]"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Done Button */}
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-medium
                  text-white bg-[#1C62A0] rounded-lg
                  hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomTimePicker;
