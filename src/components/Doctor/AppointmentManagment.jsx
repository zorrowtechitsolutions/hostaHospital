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
const RadioOption = ({ value, selected, onChange, icon: Icon, title, description }) => (
  <label className="flex items-start gap-3 py-2 cursor-pointer">
    <input
      type="radio"
      name="bookingType"
      value={value}
      checked={selected === value}
      onChange={(e) => onChange(e.target.value)}
      className="w-4 h-4 text-[#1C62A0] mt-0.5"
    />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-800">{title}</span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </label>
);

const InfoBox = ({ children }) => (
  <div className={INFO_BOX_CLASS}>{children}</div>
);

const AppointmentManagement = ({ isOpen, onClose, onSave, doctor = null, refetchDoctors }) => {
  const [selectionType, setSelectionType] = useState('manual_count');
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
    if (doctor?.id) {
      if (doctor.autoDecline && doctor.autoDecline > 0) {
        setSelectionType('auto_decline');
        setAutoDeclineMinutes(doctor.autoDecline);
      } else if (doctor.appointmentCount && doctor.appointmentCount > 0) {
        setSelectionType('manual_count');
        setManualCount(doctor.appointmentCount);
      } else {
        const savedSettings = getStorageData(STORAGE_KEY, {});
        const settings = savedSettings[doctor.id];
        if (settings) {
          setSelectionType(settings.selectionType || 'manual_count');
          setAutoDeclineMinutes(settings.autoDeclineMinutes || 5);
          setManualCount(settings.manualCount || 21);
        }
      }
    }
  }, [doctor]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (!doctor?.id) {
        showErrorToast('Doctor information is missing. Please try again.', 4000);
        return;
      }

      const doctorName = getDoctorName(doctor);
      // Use authId if available, otherwise use id
      const bookingId = doctor.authId || doctor.id;

      if (selectionType === "manual_count") {
        // MANUAL COUNT: Update doctor and cancel auto-decline
        const updateData = {
          appointmentCount: Number(manualCount),
          autoDecline: 0
        };

        const payload = {
          id: doctor.id,
          updateDoctor: updateData,
        };

        await updateDoctor(payload).unwrap();

        // Cancel auto-decline if it was running
        try {
          await cancelAutoDecline({ doctorId: bookingId }).unwrap();
          console.log('Auto-decline canceled successfully for bookingId:', bookingId);
        } catch (cancelError) {
          // Ignore if no auto-decline was running
          console.log('No auto-decline to cancel or already canceled');
        }

      } else {
        // AUTO-DECLINE: Update doctor and start auto-decline task
        const updateData = {
          autoDecline: Number(autoDeclineMinutes),
          appointmentCount: 0
        };

        // First update the doctor
        const payload = {
          id: doctor.id,
          updateDoctor: updateData,
        };

        await updateDoctor(payload).unwrap();

        // Then start the auto-decline task with correct parameter names
        try {
          const result = await startAutoDecline({
            doctorId: bookingId,
            autoDeclineMinutes: Number(autoDeclineMinutes)
          }).unwrap();
          console.log('Auto-decline started successfully:', result);
        } catch (autoDeclineError) {
          // If auto-decline fails but doctor was updated, show error
          console.error('Auto-decline start failed:', autoDeclineError);
          showErrorToast(
            `Doctor updated but auto-decline failed to start. Please try again.`,
            5000
          );
          return;
        }
      }

      // Refetch doctors to update UI
      await refetchDoctors?.();

      // Save settings to localStorage
      const settingsToSave = {
        doctorId: doctor.id,
        doctorName,
        selectionType,
        autoDeclineMinutes: selectionType === 'auto_decline' ? autoDeclineMinutes : null,
        manualCount: selectionType === 'manual_count' ? manualCount : null,
        timestamp: new Date().toISOString()
      };

      const savedSettings = getStorageData(STORAGE_KEY, {});
      savedSettings[doctor.id] = settingsToSave;
      setStorageData(STORAGE_KEY, savedSettings);

      // Show success message
      const settingDescription = selectionType === 'manual_count'
        ? `Maximum ${manualCount} appointments per day`
        : `Auto-decline after ${autoDeclineMinutes} minutes`;

      showSaveToast(`Settings saved for ${doctorName}!`, 4000, {
        Doctor: doctorName,
        'Setting Type': selectionType === 'manual_count' ? 'Manual Count Limit' : 'Auto Decline',
        Configuration: settingDescription,
        Status: 'Successfully applied'
      });

      onSave?.(settingsToSave);
      onClose();

    } catch (error) {
      const doctorName = getDoctorName(doctor);
      const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';

      showErrorToast(`Failed to save settings for ${doctorName}`, 5000, {
        Doctor: doctorName,
        'Error Details': errorMessage,
        'Action Required': 'Please try again or contact support'
      });
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

          <RadioOption
            value="auto_decline"
            selected={selectionType}
            onChange={setSelectionType}
            icon={Clock}
            title="Auto Decline"
            description="Automatically decline pending bookings after set time"
          />

          <RadioOption
            value="manual_count"
            selected={selectionType}
            onChange={setSelectionType}
            icon={Calendar}
            title="Manual Count Limit"
            description="Set maximum number of bookings allowed per day"
          />

          {selectionType === 'auto_decline' && (
            <div className={SECTION_CLASS}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Auto Decline Configuration</h4>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Auto Decline Time (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={autoDeclineMinutes}
                    onChange={(e) => setAutoDeclineMinutes(parseInt(e.target.value) || 1)}
                    className={`w-24 px-2 py-1.5 ${INPUT_CLASS}`}
                  />
                  <span className="text-xs text-gray-500">minutes</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Time before pending bookings are automatically declined
                </p>
              </div>

              <InfoBox>
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-600">
                    Current: <span className="font-medium">{autoDeclineMinutes} minutes</span> auto-decline
                  </p>
                </div>
              </InfoBox>
            </div>
          )}

          {selectionType === 'manual_count' && (
            <div className={SECTION_CLASS}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Manual Count Configuration</h4>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Maximum Bookings per Day
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={manualCount}
                    onChange={(e) => handleManualCountChange(e.target.value)}
                    onBlur={() => {
                      if (manualCount === '' || manualCount === null) {
                        setManualCount(1);
                      }
                    }}
                    className={`w-32 px-2 py-1.5 ${INPUT_CLASS}`}
                  />
                  <span className="text-xs text-gray-500">appointments per day</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of appointments that can be booked per day
                </p>
              </div>

              <InfoBox>
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-600">
                    Current: Maximum <span className="font-medium">{manualCount || 'unlimited'}</span> appointments allowed per day
                  </p>
                </div>
              </InfoBox>
            </div>
          )}
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