// src/components/patients/AddAppointmentModal.jsx
import React, { useState, useMemo } from "react";
import { Calendar, FileText } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Modal, Button, Avatar, Badge, Loader } from "../ui";
import { showWarningToast } from "../ui/Toast";
import { useGetDoctorsQuery } from "../../../app/service/doctorApi";

/* =====================================================
   Helper: patient display ID
   ===================================================== */
const getPatientDisplayId = (patient) => {
  if (patient?.patientNumber) {
    return `#PT${String(patient.patientNumber).padStart(4, "0")}`;
  }

  const id = patient?.id || patient?._id;
  return id ? `#PT${String(id).padStart(4, "0")}` : "#PT0000";
};

/* =====================================================
   Helper: convert YYYY-MM-DD → DD/MM/YYYY (for Flatpickr display)
   ===================================================== */
const toDisplayDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== "string") return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/* =====================================================
   Helper: hide ONLY next-month cells
   - Keeps all real current-month dates visible & clickable
   - Hides trailing "1, 2, 3..." from the next month
   ===================================================== */
const hideNextMonthCells = (instance) => {
  const container = instance?.calendarContainer;
  if (!container) return;

  // Clear any previous hiding
  container
    .querySelectorAll(".flatpickr-day.hidden-next-month-row")
    .forEach((el) => el.classList.remove("hidden-next-month-row"));

  // Hide every next-month cell individually
  container
    .querySelectorAll(".flatpickr-day.nextMonthDay")
    .forEach((el) => el.classList.add("hidden-next-month-row"));
};

const AddAppointmentModal = ({
  isOpen,
  onClose,
  patient,
  onProceedApprove,
  hospitalId,
}) => {
  const [formData, setFormData] = useState({
    date: "",
    quickNotes: "",
    selectDoctor: null,
    doctorId: null,
    doctorDepartment: null,
    doctorDisplayName: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: doctorsResponse,
    isLoading: isLoadingDoctors,
    isFetching: isFetchingDoctors,
  } = useGetDoctorsQuery(
    {
      hospitalId: hospitalId || patient?.hospitalId,
    },
    {
      skip: !isOpen || !patient?.hospitalId,
    }
  );

  /* =====================================================
     Doctors list (with schedule info preserved)
     ===================================================== */
  const doctorsList = useMemo(() => {
    if (!doctorsResponse?.data) return [];

    return doctorsResponse.data.map((doc) => ({
      id: doc.id,
      name:
        doc.displayName ||
        `${doc.firstName || ""} ${doc.lastName || ""}`.trim() ||
        doc.name,
      department:
        doc.specialist ||
        doc.specialty ||
        doc.department ||
        "General",
      displayName: doc.displayName || doc.name,
      consultingOne: Array.isArray(doc.consultingOne)
        ? doc.consultingOne
        : [],
      consultingTwo: Array.isArray(doc.consultingTwo)
        ? doc.consultingTwo
        : [],
    }));
  }, [doctorsResponse]);

  /* =====================================================
     Check if the selected doctor works on a given date
     ===================================================== */
  const isDoctorWorkingOnDate = (date) => {
    const doctor = doctorsList.find(
      (doc) => doc.id == formData.doctorId
    );
    if (!doctor) return true;

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName = days[date.getDay()];

    const worksInConsultingOne = doctor.consultingOne?.some(
      (item) => String(item.day).toLowerCase() === dayName
    );
    const worksInConsultingTwo = doctor.consultingTwo?.some(
      (item) => String(item.day).toLowerCase() === dayName
    );

    return worksInConsultingOne || worksInConsultingTwo;
  };

  if (!isOpen) return null;

  /* =====================================================
     Form validation
     ===================================================== */
  const validateForm = () => {
    if (!formData.selectDoctor) {
      showWarningToast("Please select doctor", 3000);
      return false;
    }
    if (!formData.date) {
      showWarningToast("Please select appointment date", 3000);
      return false;
    }
    return true;
  };

  /* =====================================================
     Submit
     ===================================================== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    if (onProceedApprove) {
      onProceedApprove({
        userId: patient?.userId,
        patient_dob: patient?.dob,
        patient_name: patient?.name,
        patient_place: patient?.location?.place || patient?.address,
        patient_phone: patient?.mobileNumber,
        patient_gender: patient?.gender,
        patient_age: Number(patient?.age),
        hospitalId: patient?.hospitalId,
        doctorId: formData.doctorId,
        booking_date: formData.date, // YYYY-MM-DD
        department: formData.doctorDepartment,
        displayName: formData.doctorDisplayName,
        notes: formData.quickNotes,
      });
    }

    setIsSubmitting(false);
    onClose();
  };

  /* =====================================================
     Doctor select — reset date if doctor changes
     ===================================================== */
  const handleDoctorSelect = (e) => {
    const doctorId = e.target.value;
    const selectedDoctor = doctorsList.find(
      (doc) => doc.id == doctorId
    );

    setFormData({
      ...formData,
      selectDoctor: selectedDoctor?.name || "",
      doctorId: selectedDoctor?.id,
      doctorDepartment: selectedDoctor?.department,
      doctorDisplayName: selectedDoctor?.displayName,
      date: "", // Reset date (schedule differs by doctor)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Appointment"
      size="md"
      showCloseButton={false}
    >
      {/* ============ Patient Info Summary ============ */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 -mt-4 -mx-6 mb-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={
              patient?.imageUrl ||
              "https://randomuser.me/api/portraits/men/32.jpg"
            }
            alt={patient?.name}
            size="md"
            rounded="full"
          />
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="text-xs font-mono bg-white"
              >
                {getPatientDisplayId(patient)}
              </Badge>
              <Badge variant="success" className="text-xs">
                Last Visit: {patient?.lastVisitDisplay || "N/A"}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900">
              {patient?.name || "Patient Name"}
            </h3>
            <p className="text-xs text-gray-600">
              {patient?.gender || "N/A"} • {patient?.age || "N/A"} years
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          {/* ============ Doctor Selection ============ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Doctor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.doctorId || ""}
              onChange={handleDoctorSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoadingDoctors || isFetchingDoctors}
            >
              <option value="">
                {isLoadingDoctors || isFetchingDoctors
                  ? "Loading doctors..."
                  : "Select Doctor"}
              </option>
              {doctorsList.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.department}
                </option>
              ))}
            </select>
            {(isLoadingDoctors || isFetchingDoctors) && (
              <div className="mt-2 flex items-center gap-2">
                <Loader size="small" />
                <span className="text-xs text-gray-500">
                  Loading doctors...
                </span>
              </div>
            )}
          </div>

          {/* ============ Appointment Date (Flatpickr — needs doctor schedule logic) ============ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Date <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />

              <Flatpickr
                value={toDisplayDate(formData.date)}
                options={{
                  dateFormat: "d/m/Y",
                  minDate: "today",

                  // Disable doctor's non-working days
                  disable: [
                    (date) => !isDoctorWorkingOnDate(date),
                  ],

                  allowInput: false,
                  clickOpens: !!formData.doctorId,

                  // Hide next-month cells on every relevant lifecycle event
                  onReady: (selectedDates, dateStr, instance) =>
                    hideNextMonthCells(instance),
                  onMonthChange: (selectedDates, dateStr, instance) =>
                    hideNextMonthCells(instance),
                  onYearChange: (selectedDates, dateStr, instance) =>
                    hideNextMonthCells(instance),
                  onOpen: (selectedDates, dateStr, instance) =>
                    hideNextMonthCells(instance),
                }}
                onChange={(selectedDates) => {
                  if (!selectedDates.length) {
                    setFormData((prev) => ({
                      ...prev,
                      date: "",
                    }));
                    return;
                  }

                  const date = selectedDates[0];

                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(
                    2,
                    "0"
                  );
                  const day = String(date.getDate()).padStart(2, "0");

                  // Store backend format: YYYY-MM-DD
                  setFormData((prev) => ({
                    ...prev,
                    date: `${year}-${month}-${day}`,
                  }));
                }}
                disabled={!formData.doctorId}
                placeholder="Select appointment date"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {!formData.doctorId && (
              <p className="text-xs text-gray-500 mt-1">
                Select a doctor first to view available dates
              </p>
            )}
          </div>

          {/* ============ Quick Notes ============ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                rows="3"
                value={formData.quickNotes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quickNotes: e.target.value,
                  })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Additional information about the appointment..."
              />
            </div>
          </div>
        </div>

        {/* ============ Actions ============ */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Proceed to Approve"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAppointmentModal;