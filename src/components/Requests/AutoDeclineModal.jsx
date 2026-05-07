import React, { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "../ui";
import { showSuccessToast, showWarningToast } from "../ui/Toast";

const AutoDeclineModal = ({ isOpen, onClose, currentMinutes = 5, onSave }) => {
  const [minutes, setMinutes] = useState(currentMinutes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMinutes(currentMinutes);
    }
  }, [isOpen, currentMinutes]);

  if (!isOpen) return null;

  const handleSave = () => {
    const value = parseInt(minutes, 10);
    if (value >= 1 && value <= 1440) {
      setIsSaving(true);
      
      setTimeout(() => {
        if (onSave) onSave(value);
        
        showSuccessToast(
          `Auto decline time has been updated to ${value} minute${value !== 1 ? 's' : ''}!`,
          4000,
          {
            'Previous': `${currentMinutes} minute${currentMinutes !== 1 ? 's' : ''}`,
            'New': `${value} minute${value !== 1 ? 's' : ''}`
          }
        );
        
        setIsSaving(false);
        onClose();
      }, 500);
    } else {
      showWarningToast("Please enter a value between 1 and 1440 minutes", 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* MODAL */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-7 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Auto Decline Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Set the automatic decline time for pending bookings.
              Bookings not accepted within this time will be automatically declined.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </Button>
        </div>

        {/* BODY */}
        <div className="px-7 py-6">
          {/* LABEL */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Auto Decline Time (Minutes)
          </label>

          {/* INPUT */}
          <div className="relative">
            <Clock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="number"
              min="1"
              max="1440"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>

          {/* HELP TEXT */}
          <p className="text-xs text-gray-500 mt-2">
            Set how many minutes a booking stays in pending status
            before being automatically declined (1-1440 minutes)
          </p>

          {/* CURRENT SETTING */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              Current Setting:
            </p>
            <p className="text-sm text-blue-700">
              Pending bookings will be automatically declined after{" "}
              <span className="font-bold">
                {minutes} minute{minutes !== 1 ? "s" : ""}
              </span>{" "}
              if not accepted.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg font-medium"
            disabled={isSaving}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutoDeclineModal;