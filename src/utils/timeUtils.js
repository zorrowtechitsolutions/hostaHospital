// src/utils/timeUtils.js

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {string} time24h - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format with AM/PM (e.g., "2:30 PM")
 */
export const convertTo12Hour = (time24h) => {
  if (!time24h || time24h === "N/A") return "";
  
  // If already in 12-hour format, return as is
  if (time24h.includes("AM") || time24h.includes("PM")) {
    return time24h;
  }
  
  // Handle cases where time might be in HH:MM:SS format
  const timeParts = time24h.split(":");
  if (timeParts.length < 2) return time24h;
  
  const hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  
  // Validate hours
  if (isNaN(hours) || hours < 0 || hours > 23) return time24h;
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
  
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Convert 12-hour time with AM/PM to 24-hour format (HH:mm)
 * @param {string} time12h - Time in 12-hour format (e.g., "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 */
export const convertTo24Hour = (time12h) => {
  if (!time12h) return "";
  
  // If already in 24-hour format, return as is
  if (!time12h.includes("AM") && !time12h.includes("PM")) {
    // Check if it's already HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(time12h)) {
      const [hours] = time12h.split(":");
      if (parseInt(hours, 10) >= 0 && parseInt(hours, 10) <= 23) {
        return time12h.padStart(5, "0");
      }
    }
    return time12h;
  }
  
  // Split time and modifier
  const parts = time12h.trim().split(" ");
  if (parts.length !== 2) return time12h;
  
  const time = parts[0];
  const modifier = parts[1].toUpperCase();
  
  if (modifier !== "AM" && modifier !== "PM") return time12h;
  
  const timeParts = time.split(":");
  if (timeParts.length < 2) return time12h;
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  
  // Validate hours
  if (isNaN(hours) || hours < 1 || hours > 12) return time12h;
  
  if (hours === 12 && modifier === "AM") {
    hours = 0;
  } else if (hours === 12 && modifier === "PM") {
    hours = 12;
  } else if (modifier === "PM") {
    hours += 12;
  }
  
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

/**
 * Format time for display in 12-hour format
 * @param {string} time - Time string (24-hour or 12-hour)
 * @returns {string} Formatted time in 12-hour format
 */
export const formatDisplayTime = (time) => {
  if (!time || time === "N/A") return "N/A";
  return convertTo12Hour(time);
};

/**
 * Format time for input field (HH:mm) - 24-hour format for time input
 * @param {string} timeString - Time string (12-hour or 24-hour)
 * @returns {string} Time in HH:mm format (24-hour)
 */
export const formatTimeForInput = (timeString) => {
  if (!timeString || timeString === "N/A") return "";
  
  // If it's 12-hour format, convert to 24-hour
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return convertTo24Hour(timeString);
  }
  
  // If it's already 24-hour, ensure it's HH:mm
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    const [hours, minutes] = timeString.split(":");
    if (parseInt(hours, 10) >= 0 && parseInt(hours, 10) <= 23) {
      return `${hours.padStart(2, "0")}:${minutes}`;
    }
  }
  
  return timeString;
};

/**
 * Get current time in HH:mm format (24-hour)
 * @returns {string} Current time in HH:mm format
 */
export const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Get current time in 12-hour format with AM/PM
 * @returns {string} Current time in 12-hour format
 */
export const getCurrentTime12Hour = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Format time for API (24-hour format HH:mm)
 * @param {string} timeString - Time string
 * @returns {string} Time in 24-hour format for API
 */
export const formatTimeForAPI = (timeString) => {
  if (!timeString) return "";
  
  // If it's 12-hour format, convert to 24-hour
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return convertTo24Hour(timeString);
  }
  
  // If it's already 24-hour, ensure proper format
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    const [hours, minutes] = timeString.split(":");
    if (parseInt(hours, 10) >= 0 && parseInt(hours, 10) <= 23) {
      return `${hours.padStart(2, "0")}:${minutes}`;
    }
  }
  
  return timeString;
};

/**
 * Validate time string format
 * @param {string} timeString - Time string to validate
 * @param {string} format - '12h' or '24h' (default: '24h')
 * @returns {boolean} True if time is valid
 */
export const isValidTime = (timeString, format = '24h') => {
  if (!timeString) return false;
  
  if (format === '12h') {
    // 12-hour format: HH:MM AM/PM
    return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(timeString.trim());
  } else {
    // 24-hour format: HH:MM
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
  }
};

/**
 * Convert time to 12-hour format string for display in tables
 * @param {string} timeString - Time string (any format)
 * @returns {string} Time in 12-hour format or empty string
 */
export const formatTimeForTable = (timeString) => {
  if (!timeString || timeString === "N/A") return "";
  
  // If it's in 12-hour format with AM/PM, return as is
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return timeString;
  }
  
  // Convert 24-hour to 12-hour
  return convertTo12Hour(timeString);
};

/**
 * Check if time is in 12-hour format
 * @param {string} timeString - Time string to check
 * @returns {boolean} True if time is in 12-hour format
 */
export const is12HourFormat = (timeString) => {
  if (!timeString) return false;
  return timeString.includes("AM") || timeString.includes("PM");
};

/**
 * Check if time is in 24-hour format
 * @param {string} timeString - Time string to check
 * @returns {boolean} True if time is in 24-hour format
 */
export const is24HourFormat = (timeString) => {
  if (!timeString) return false;
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
};

/**
 * Get hours from time string
 * @param {string} timeString - Time string
 * @returns {number} Hours (0-23)
 */
export const getHours = (timeString) => {
  if (!timeString) return 0;
  
  // If 12-hour format, convert to 24-hour first
  let time24 = timeString;
  if (timeString.includes("AM") || timeString.includes("PM")) {
    time24 = convertTo24Hour(timeString);
  }
  
  const parts = time24.split(":");
  if (parts.length < 1) return 0;
  
  return parseInt(parts[0], 10) || 0;
};

/**
 * Get minutes from time string
 * @param {string} timeString - Time string
 * @returns {number} Minutes (0-59)
 */
export const getMinutes = (timeString) => {
  if (!timeString) return 0;
  
  // If 12-hour format, convert to 24-hour first
  let time24 = timeString;
  if (timeString.includes("AM") || timeString.includes("PM")) {
    time24 = convertTo24Hour(timeString);
  }
  
  const parts = time24.split(":");
  if (parts.length < 2) return 0;
  
  return parseInt(parts[1], 10) || 0;
};

/**
 * Add minutes to a time string
 * @param {string} timeString - Time string (12-hour or 24-hour)
 * @param {number} minutesToAdd - Minutes to add
 * @param {string} outputFormat - '12h' or '24h' (default: '24h')
 * @returns {string} New time string
 */
export const addMinutesToTime = (timeString, minutesToAdd, outputFormat = '24h') => {
  if (!timeString) return "";
  
  // Convert to 24-hour for calculation
  let time24 = timeString;
  if (timeString.includes("AM") || timeString.includes("PM")) {
    time24 = convertTo24Hour(timeString);
  }
  
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeString;
  
  // Calculate total minutes and add
  let totalMinutes = (hours * 60) + minutes + minutesToAdd;
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440; // Handle negative and wrap around
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  const result = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  
  // Return in requested format
  if (outputFormat === '12h') {
    return convertTo12Hour(result);
  }
  return result;
};

/**
 * Subtract minutes from a time string
 * @param {string} timeString - Time string (12-hour or 24-hour)
 * @param {number} minutesToSubtract - Minutes to subtract
 * @param {string} outputFormat - '12h' or '24h' (default: '24h')
 * @returns {string} New time string
 */
export const subtractMinutesFromTime = (timeString, minutesToSubtract, outputFormat = '24h') => {
  return addMinutesToTime(timeString, -minutesToSubtract, outputFormat);
};

/**
 * Compare two time strings
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {number} Negative if time1 < time2, 0 if equal, positive if time1 > time2
 */
export const compareTimes = (time1, time2) => {
  if (!time1 && !time2) return 0;
  if (!time1) return -1;
  if (!time2) return 1;
  
  // Convert both to 24-hour format for comparison
  const t1 = time1.includes("AM") || time1.includes("PM") ? convertTo24Hour(time1) : time1;
  const t2 = time2.includes("AM") || time2.includes("PM") ? convertTo24Hour(time2) : time2;
  
  // Convert to minutes for comparison
  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

/**
 * Check if time1 is before time2
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {boolean} True if time1 is before time2
 */
export const isTimeBefore = (time1, time2) => {
  return compareTimes(time1, time2) < 0;
};

/**
 * Check if time1 is after time2
 * @param {string} time1 - First time string
 * @param {string} time2 - Second time string
 * @returns {boolean} True if time1 is after time2
 */
export const isTimeAfter = (time1, time2) => {
  return compareTimes(time1, time2) > 0;
};

/**
 * Check if time is between startTime and endTime
 * @param {string} time - Time to check
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {boolean} True if time is between start and end
 */
export const isTimeBetween = (time, startTime, endTime) => {
  if (!time || !startTime || !endTime) return false;
  return isTimeAfter(time, startTime) && isTimeBefore(time, endTime);
};

/**
 * Generate time slots between start and end times with interval
 * @param {string} startTime - Start time (24-hour format)
 * @param {string} endTime - End time (24-hour format)
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 * @param {string} outputFormat - '12h' or '24h' (default: '24h')
 * @returns {string[]} Array of time slots
 */
export const generateTimeSlots = (startTime, endTime, intervalMinutes = 30, outputFormat = '24h') => {
  if (!startTime || !endTime) return [];
  
  const slots = [];
  let current = startTime;
  
  while (isTimeBefore(current, endTime) || current === endTime) {
    if (outputFormat === '12h') {
      slots.push(convertTo12Hour(current));
    } else {
      slots.push(current);
    }
    current = addMinutesToTime(current, intervalMinutes, '24h');
  }
  
  return slots;
};

// Export all functions
export default {
  convertTo12Hour,
  convertTo24Hour,
  formatDisplayTime,
  formatTimeForInput,
  getCurrentTime,
  getCurrentTime12Hour,
  formatTimeForAPI,
  isValidTime,
  formatTimeForTable,
  is12HourFormat,
  is24HourFormat,
  getHours,
  getMinutes,
  addMinutesToTime,
  subtractMinutesFromTime,
  compareTimes,
  isTimeBefore,
  isTimeAfter,
  isTimeBetween,
  generateTimeSlots,
};