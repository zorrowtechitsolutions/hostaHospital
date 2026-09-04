import { useState, useEffect } from 'react';
import { Clock, X, Save, Settings, Users, Calendar, AlertCircle } from 'lucide-react';
import { 
  useUpdateDoctorMutation,
  useStartAutoDeclineMutation,
  useCancelAutoDeclineMutation 
} from "../../../app/service/doctorApi";
import { showSaveToast, showErrorToast } from '../ui/Toast';

// ==================== CONSTANTS ====================
const STORAGE_KEY = 'appointmentSettings';

const MODAL_CLASS = 'fixed inset-0 bg-black/30 flex items-center justify-center z-50';
const INPUT_CLASS = 'border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3676ae]';
const SECTION_CLASS = 'mt-5 pt-4 border-t border-gray-100';
const INFO_BOX_CLASS = 'mt-3 p-2 bg-gray-50 rounded border border-gray-100';

// ==================== HELPER FUNCTIONS ====================
const getDoctorName = (doctor) =>
  doctor?.displayName ||
  `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() ||
  doctor?.name ||
  'Doctor';

const getStorageData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStorageData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ==================== REUSABLE COMPONENTS ====================
const CheckboxOption = ({
  checked,
  onChange,
  icon: Icon,
  title,
  description,
}) => (
  <label className="flex items-start gap-3 py-3 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#1C62A0] focus:ring-[#1C62A0]"
    />

    <div className="flex-1">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-[#1C62A0]" />

        <span className="text-sm font-semibold text-gray-800">
          {title}
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {description}
      </p>
    </div>
  </label>
);

const InfoBox = ({ children }) => (
  <div className={INFO_BOX_CLASS}>{children}</div>
);

const AppointmentManagement = ({ isOpen, onClose, onSave, doctor = null, refetchDoctors }) => {
  
const [autoDeclineEnabled, setAutoDeclineEnabled] = useState(false);
const [manualCountEnabled, setManualCountEnabled] = useState(false);

const [autoDeclineMinutes, setAutoDeclineMinutes] = useState(5);
const [manualCount, setManualCount] = useState(21);
  const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();
  const [startAutoDecline, { isLoading: isStartingAutoDecline }] = useStartAutoDeclineMutation();
  const [cancelAutoDecline, { isLoading: isCancelingAutoDecline }] = useCancelAutoDeclineMutation();

  // Combined loading state
  const isLoading = isUpdating || isStartingAutoDecline || isCancelingAutoDecline;

  const handleManualCountChange = (value) => {
    if (value === '') {
      setManualCount('');
      return;
    }
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) {
      setManualCount(parsedValue < 1 ? 1 : parsedValue);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

useEffect(() => {
  if (!doctor?.id) return;

  // AUTO DECLINE
  if (doctor.autoDecline && Number(doctor.autoDecline) > 0) {
    setAutoDeclineEnabled(true);
    setAutoDeclineMinutes(Number(doctor.autoDecline));
  } else {
    setAutoDeclineEnabled(false);
  }

  // MANUAL COUNT
  if (doctor.appointmentCount && Number(doctor.appointmentCount) > 0) {
    setManualCountEnabled(true);
    setManualCount(Number(doctor.appointmentCount));
  } else {
    setManualCountEnabled(false);
  }

  // Local storage fallback
  const savedSettings = getStorageData(STORAGE_KEY, {});
  const settings = savedSettings[doctor.id];

  if (settings) {
    if (!doctor.autoDecline) {
      setAutoDeclineEnabled(
        settings.autoDeclineEnabled ?? false
      );
    }

    if (!doctor.appointmentCount) {
      setManualCountEnabled(
        settings.manualCountEnabled ?? false
      );
    }

    setAutoDeclineMinutes(
      settings.autoDeclineMinutes || doctor.autoDecline || 5
    );

    setManualCount(
      settings.manualCount || doctor.appointmentCount || 21
    );
  }
}, [doctor]);


  if (!isOpen) return null;

const handleSave = async () => {
  try {
    if (!doctor?.id) {
      showErrorToast(
        'Doctor information is missing. Please try again.',
        4000
      );
      return;
    }

    // At least one option should be selected
    if (!autoDeclineEnabled && !manualCountEnabled) {
      showErrorToast(
        'Please select at least one appointment setting.',
        4000
      );
      return;
    }

    const doctorName = getDoctorName(doctor);
    const bookingId = doctor.authId || doctor.id;

    // ===============================
    // SAVE BOTH SETTINGS TOGETHER
    // ===============================

    const updateData = {
      autoDecline: autoDeclineEnabled
        ? Number(autoDeclineMinutes)
        : 0,

      appointmentCount: manualCountEnabled
        ? Number(manualCount)
        : 0,
    };

    const payload = {
      id: doctor.id,
      updateDoctor: updateData,
    };

    // Update doctor settings
    await updateDoctor(payload).unwrap();


    // ===============================
    // AUTO DECLINE API MANAGEMENT
    // ===============================

    if (autoDeclineEnabled) {
      try {
        await startAutoDecline({
          doctorId: bookingId,
          autoDeclineMinutes: Number(autoDeclineMinutes),
        }).unwrap();

        console.log('Auto-decline started successfully');

      } catch (error) {
        console.error(
          'Auto-decline start failed:',
          error
        );

        showErrorToast(
          'Settings updated, but auto-decline failed to start.',
          5000
        );

        return;
      }
    } else {
      // Cancel only when auto decline is disabled
      try {
        await cancelAutoDecline({
          doctorId: bookingId,
        }).unwrap();

        console.log('Auto-decline canceled successfully');

      } catch (error) {
        console.log(
          'No active auto-decline task found'
        );
      }
    }


    // ===============================
    // REFRESH DOCTORS
    // ===============================

    await refetchDoctors?.();


    // ===============================
    // SAVE LOCAL STORAGE
    // ===============================

    const settingsToSave = {
      doctorId: doctor.id,
      doctorName,

      autoDeclineEnabled,
      autoDeclineMinutes: autoDeclineEnabled
        ? Number(autoDeclineMinutes)
        : null,

      manualCountEnabled,
      manualCount: manualCountEnabled
        ? Number(manualCount)
        : null,

      timestamp: new Date().toISOString(),
    };

    const savedSettings = getStorageData(
      STORAGE_KEY,
      {}
    );

    savedSettings[doctor.id] = settingsToSave;

    setStorageData(
      STORAGE_KEY,
      savedSettings
    );


    // ===============================
    // SUCCESS MESSAGE
    // ===============================

    let settingDescription = [];

    if (autoDeclineEnabled) {
      settingDescription.push(
        `Auto-decline: ${autoDeclineMinutes} minutes`
      );
    }

    if (manualCountEnabled) {
      settingDescription.push(
        `Daily limit: ${manualCount} appointments`
      );
    }

    showSaveToast(
      `Settings saved for ${doctorName}!`,
      4000,
      {
        Doctor: doctorName,
        Settings: settingDescription.join(' | '),
        Status: 'Successfully applied',
      }
    );


    onSave?.(settingsToSave);
    onClose();

  } catch (error) {

    const doctorName = getDoctorName(doctor);

    const errorMessage =
      error?.data?.message ||
      error?.message ||
      'Unknown error occurred';

    console.error('Save settings error:', error);

    showErrorToast(
      `Failed to save settings for ${doctorName}`,
      5000,
      {
        Doctor: doctorName,
        'Error Details': errorMessage,
        'Action Required': 'Please try again',
      }
    );
  }
};
  return (
    <div className={MODAL_CLASS}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-600" />
            <h2 className="text-md font-semibold text-gray-800">Appointment Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {doctor && (
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{getDoctorName(doctor)}</span>
                {doctor?.specialist && ` • ${doctor.specialist}`}
                {!doctor?.specialist && doctor?.specialty && ` • ${doctor.specialty}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ID: {doctor.id} {doctor.authId && `| Auth ID: ${doctor.authId}`}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-3">Choose how to manage appointment bookings</p>

<p className="text-xs text-gray-500 mb-4">
  Configure one or both appointment rules for this doctor
</p>

{/* AUTO DECLINE CARD */}
<div
  className={`rounded-xl border p-4 mb-3 transition-all ${
    autoDeclineEnabled
      ? 'border-blue-300 bg-blue-50/40'
      : 'border-gray-200 bg-white'
  }`}
>
  <CheckboxOption
    checked={autoDeclineEnabled}
    onChange={setAutoDeclineEnabled}
    icon={Clock}
    title="Auto Decline"
    description="Automatically decline pending bookings after a set time"
  />

  {autoDeclineEnabled && (
    <div className="mt-3 ml-7 pt-3 border-t border-blue-100">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Auto Decline After
      </label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="1440"
          value={autoDeclineMinutes}
          onChange={(e) =>
            setAutoDeclineMinutes(
              parseInt(e.target.value) || 1
            )
          }
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <span className="text-xs text-gray-500">
          minutes
        </span>
      </div>
    </div>
  )}
</div>


{/* MANUAL COUNT CARD */}
<div
  className={`rounded-xl border p-4 transition-all ${
    manualCountEnabled
      ? 'border-emerald-300 bg-emerald-50/40'
      : 'border-gray-200 bg-white'
  }`}
>
  <CheckboxOption
    checked={manualCountEnabled}
    onChange={setManualCountEnabled}
    icon={Users}
    title="Daily Appointment Limit"
    description="Set maximum number of appointments allowed per day"
  />

  {manualCountEnabled && (
    <div className="mt-3 ml-7 pt-3 border-t border-emerald-100">
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Maximum Appointments
      </label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={manualCount}
          onChange={(e) =>
            handleManualCountChange(e.target.value)
          }
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />

        <span className="text-xs text-gray-500">
          appointments / day
        </span>
      </div>
    </div>
  )}
</div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1C62A0] rounded hover:bg-[#6b97bd] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={12} />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagement;