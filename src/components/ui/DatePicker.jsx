// src/components/ui/DatePicker.jsx
import React from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

/* =====================================================
   Convert YYYY-MM-DD (state) → DD/MM/YYYY (Flatpickr display)
   ===================================================== */
const toDisplayDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== "string") return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/* =====================================================
   Global defaults
   ===================================================== */
const BASE_OPTIONS = {
  dateFormat: "d/m/Y",
  allowInput: false,
  disableMobile: true,
  monthSelectorType: "static",
  animate: true,
};

const today = new Date();
const minDob = new Date(
  today.getFullYear() - 120,
  today.getMonth(),
  today.getDate()
);

const PRESETS = {
  any: { ...BASE_OPTIONS },
  past: { ...BASE_OPTIONS, maxDate: "today" },
  future: { ...BASE_OPTIONS, minDate: "today" },
  dob: { ...BASE_OPTIONS, maxDate: "today", minDate: minDob },
};

/**
 * Universal DatePicker wrapper.
 *
 * Props:
 *   value        ISO date string (YYYY-MM-DD)
 *   onChange     (isoString) => void
 *   mode         "any" | "past" | "future" | "dob"   (default: "any")
 *   options      extra Flatpickr options merged on top of preset
 *   className    custom classes for the input
 *   placeholder  input placeholder
 *   disabled     disables input
 */
const DatePicker = ({
  value,
  onChange,
  mode = "any",
  options = {},
  className = "",
  placeholder = "Select date",
  disabled = false,
  ...rest
}) => {
  const preset = PRESETS[mode] || PRESETS.any;

  const handleChange = (selectedDates) => {
    if (!selectedDates.length) {
      onChange?.("");
      return;
    }

    const date = selectedDates[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    onChange?.(`${year}-${month}-${day}`);
  };

  return (
    <Flatpickr
      value={toDisplayDate(value)}
      options={{ ...preset, ...options }}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={
        className ||
        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      }
      {...rest}
    />
  );
};

export default DatePicker;