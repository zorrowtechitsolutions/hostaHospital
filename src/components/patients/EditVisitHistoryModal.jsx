// src/components/visits/EditVisitModal.jsx - With toast notifications
import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "../ui";
import CustomSelect from "../ui/CustomSelect";
import { showUpdateToast, showWarningToast } from "../ui/Toast";

/* ============================================================
   Helper: normalize any options prop into {value, label} pairs.
   Handles:
     - plain strings:       ['Cardiology', ...]
     - already-normalized:  [{value, label}, ...]  (pass through)
     - objects w/ name:     [{id, name}, ...]      (value = name)
     - objects w/ id only:  [{id}, ...]            (value = id)
   Prefers `name` over `id` for the value, to match how
   visitData stores department / doctor / patient by NAME.
   ============================================================ */
const toSelectOptions = (arr = []) =>
  (Array.isArray(arr) ? arr : []).map((opt) => {
    if (opt && typeof opt === 'object') {
      if ('value' in opt && 'label' in opt) return opt;
      return {
        value: opt.value ?? opt.name ?? opt.id ?? String(opt),
        label: opt.label ?? opt.name ?? String(opt),
      };
    }
    return { value: opt, label: opt };
  });

const EditVisitModal = ({
  isOpen,
  onClose,
  visitData,
  onSave,
  patients = [],
  departments = [],
  doctors = [],
  patientTypes = ["Out Patient", "In Patient"],
  paymentMethods = ["Cash", "Card", "Insurance", "Online Transfer", "Check"]
}) => {
  const [formData, setFormData] = useState({
    patient: "",
    patientType: "Out Patient",
    department: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
    payment: "Cash"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visitData) {
      setFormData({
        patient: visitData.patientName || visitData.patient || "",
        patientType: visitData.patientType || "Out Patient",
        department: visitData.department || "",
        doctor: visitData.doctorName || visitData.doctor || "",
        date: visitData.visitDate || visitData.date || "",
        time: visitData.startTime || visitData.time || "",
        reason: visitData.reason || "",
        payment: visitData.paymentMethod || visitData.payment || "Cash"
      });
    }
  }, [visitData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.doctor) newErrors.doctor = "Doctor is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.reason) newErrors.reason = "Reason is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showWarningToast('Please fill in all required fields', 3000);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const updatedData = {
        patientName: formData.patient,
        patientType: formData.patientType,
        department: formData.department,
        doctorName: formData.doctor,
        visitDate: formData.date,
        startTime: formData.time,
        reason: formData.reason,
        paymentMethod: formData.payment
      };

      if (onSave) onSave(updatedData);

      showUpdateToast(
        `Visit for ${formData.patient} has been updated successfully!`,
        4000,
        {
          'Patient': formData.patient,
          'Department': formData.department,
          'Doctor': formData.doctor,
          'Date': formData.date
        }
      );

      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg" showCloseButton={false}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {/* ✅ Replaced  (Patient) with CustomSelect */}
          <CustomSelect
            label="Select Patient"
            value={formData.patient}
            options={toSelectOptions(patients)}
            onChange={(value) => handleChange({ target: { name: 'patient', value } })}
          />

          {/* ✅ Replaced  (Patient Type) with CustomSelect */}
          <CustomSelect
            label="Patient Type"
            value={formData.patientType}
            options={toSelectOptions(patientTypes)}
            onChange={(value) => handleChange({ target: { name: 'patientType', value } })}
          />

          {/* ✅ Replaced  (Department) with CustomSelect */}
          <CustomSelect
            label="Select Department"
            value={formData.department}
            options={toSelectOptions(departments)}
            onChange={(value) => handleChange({ target: { name: 'department', value } })}
            error={errors.department}
            touched={!!errors.department}
            required
          />

          {/* ✅ Replaced  (Doctor) with CustomSelect */}
          <CustomSelect
            label="Select Doctor"
            value={formData.doctor}
            options={toSelectOptions(doctors)}
            onChange={(value) => handleChange({ target: { name: 'doctor', value } })}
            error={errors.doctor}
            touched={!!errors.doctor}
            required
          />

          <Input
            label="Date of Visit"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            required
          />
          <Input
            label="Time of Visit"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
          />
          <Input
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Enter reason for visit"
            error={errors.reason}
            required
          />

          {/* ✅ Replaced  (Payment) with CustomSelect */}
          <CustomSelect
            label="Mode of Payment"
            value={formData.payment}
            options={toSelectOptions(paymentMethods)}
            onChange={(value) => handleChange({ target: { name: 'payment', value } })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditVisitModal;