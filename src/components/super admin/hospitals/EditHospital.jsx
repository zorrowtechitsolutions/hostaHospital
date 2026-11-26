// src/components/super-admin/hospitals/EditHospital.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Building,
  Building2,
  MapPin,
  Globe,
  Landmark,
  Home,
  CreditCard,
  Phone,
  Mail,
  Navigation,
  Clock,
  Sun,
  Briefcase,
  ChevronDown,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import GoogleMapsLocationPicker from '../../../Authentication/GoogleMapsLocationPicker';
import { Button, Card, Input, Alert } from '../../ui';
import CustomSelect from '../../ui/CustomSelect';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast
} from '../../ui/Toast';
import { useUpdateHospitalMutation } from '../../../../app/service/hospitalApi';
// ✅ PINCODE API
import { useGetPincodeQuery } from '../../../../app/service/pincodeApi';

const HOSPITAL_TYPES = [
  'Allopathy', 'Homeopathy', 'Ayurveda', 'Unani',
  'Physiotherapy', 'Mental Health', 'Laboratory', 'Other'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ✅ Static options for the Hospital Type CustomSelect
const hospitalTypeOptions = HOSPITAL_TYPES.map((type) => ({ value: type, label: type }));

// ✅ Static options for the Working Hours Type CustomSelect — emojis preserved
const WORKING_HOUR_TYPE_OPTIONS = [
  { value: 'normal', label: '🏥 Normal Hospital' },
  { value: 'clinic', label: '🏪 Clinic' },
  { value: 'clinic-break', label: '🏪 Clinic with Break' },
];

// Styling override so CustomSelect matches the py-3 rounded-xl / focus:ring-[#154A7D] form fields
const FORM_SELECT_CLASS =
  "w-full [&>button]:py-3 [&>button]:border-gray-200 [&>button]:rounded-xl [&>button]:text-sm [&>button]:font-medium [&>button]:text-black [&>button]:focus:ring-2 [&>button]:focus:ring-[#154A7D] [&>button]:focus:border-transparent";

// ============================================
// SEARCHABLE LOCAL AREA DROPDOWN (post offices)
// ============================================

const SearchableLocalAreaDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.name);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
        <input
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium ${
            disabled ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : ''
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-[#F5FAFF] cursor-pointer transition-colors flex items-center gap-2"
              onClick={() => handleSelect(option)}
            >
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{option.name}</span>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

const EditHospital = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hospitalData = location.state?.hospital;
  const [updateHospital, { isLoading: isApiLoading }] = useUpdateHospitalMutation();

  const [workingHourType, setWorkingHourType] = useState("normal");
  const [is24x7, setIs24x7] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [updateError, setUpdateError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyNumber: '',
    about: '',
    hospitalType: '',
    streetAddress: '',
    pincode: '',
    latitude: '',
    longitude: '',
    countryName: 'India',
    stateName: '',
    cityName: '',
    localArea: '',
  });

  const [errors, setErrors] = useState({});
  const [originalPincode, setOriginalPincode] = useState('');

  // ✅ PINCODE API integration — same as Register.jsx
  const {
    currentData: pincodeData,
    isFetching: isPincodeLoading,
    isError: isPincodeError,
  } = useGetPincodeQuery(formData.pincode, {
    skip: !/^\d{6}$/.test(formData.pincode || ''),
  });

  const postOffices =
    pincodeData?.[0]?.Status === "Success"
      ? pincodeData[0].PostOffice || []
      : [];

  // Unique post office names for the Local Area dropdown
  const localAreaOptions = useMemo(
    () =>
      [
        ...new Map(
          postOffices.map((office) => [office.Name, { name: office.Name }])
        ).values()
      ],
    [postOffices]
  );

  // ✅ Auto-fill state / district when pincode lookup returns
  // Skip if pincode === original saved pincode (keep saved address as-is)
  useEffect(() => {
    if (!pincodeData) return;
    if (String(formData.pincode) === String(originalPincode || '')) return;

    if (postOffices.length > 0) {
      const firstOffice = postOffices[0];
      setFormData(prev => ({
        ...prev,
        stateName: firstOffice.State,
        cityName: firstOffice.District,
        countryName: 'India',
        localArea: '',
      }));
    } else if (String(formData.pincode || '').length === 6) {
      setFormData(prev => ({ ...prev, stateName: '', cityName: '', localArea: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeData]);

  const [normalHours, setNormalHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  const [clinicHours, setClinicHours] = useState({
    monday: { start: "09:00", end: "18:00", isHoliday: false },
    tuesday: { start: "09:00", end: "18:00", isHoliday: false },
    wednesday: { start: "09:00", end: "18:00", isHoliday: false },
    thursday: { start: "09:00", end: "18:00", isHoliday: false },
    friday: { start: "09:00", end: "18:00", isHoliday: false },
    saturday: { start: "09:00", end: "18:00", isHoliday: false },
    sunday: { start: "09:00", end: "18:00", isHoliday: true }
  });

  const [clinicBreakHours, setClinicBreakHours] = useState({
    monday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    tuesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    wednesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    thursday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    friday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    saturday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
    sunday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: true }
  });

  // ✅ Hydrate form from hospitalData
  useEffect(() => {
    if (!hospitalData) return;

    const address = hospitalData.address || {};
    const savedPincode = address.pincode ? String(address.pincode) : '';

    setFormData({
      name: hospitalData.name || '',
      email: hospitalData.email || '',
      phone: hospitalData.phone || '',
      emergencyNumber: hospitalData.emergencyContact || '',
      about: hospitalData.about || '',
      hospitalType: hospitalData.type || '',
      streetAddress: address.place || '',
      pincode: savedPincode,
      latitude: hospitalData.latitude?.toString() || '',
      longitude: hospitalData.longitude?.toString() || '',
      countryName: address.country || 'India',
      stateName: address.state || '',
      cityName: address.district || '',
      localArea: address.localArea || '',
    });

    setOriginalPincode(savedPincode);

    if (hospitalData.working_hours_general && hospitalData.working_hours_general.length > 0) {
      const mappedHours = {};
      DAYS.forEach(day => {
        const dayKey = day.toLowerCase();
        const found = hospitalData.working_hours_general.find(h => h.day === dayKey);
        if (found) {
          mappedHours[dayKey] = {
            start: found.opening_time || '09:00',
            end: found.closing_time || '18:00',
            isHoliday: found.is_holiday || false
          };
        }
      });
      setNormalHours(prev => ({ ...prev, ...mappedHours }));
    }

    if (hospitalData.working_hours_clinic && hospitalData.working_hours_clinic.length > 0) {
      setWorkingHourType('clinic');
    } else if (hospitalData.working_hours_clinic_nobreak && hospitalData.working_hours_clinic_nobreak.length > 0) {
      setWorkingHourType('clinic-break');
    } else if (hospitalData.working_hours_general && hospitalData.working_hours_general.length > 0) {
      setWorkingHourType('normal');
    }
  }, [hospitalData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ Pincode change handler: digits only, max 6, resets / restores location fields
  const handlePincodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);

    setFormData(prev => {
      // Back to the saved pincode -> restore saved address fields
      if (cleaned === String(originalPincode || '')) {
        const address = hospitalData?.address || {};
        return {
          ...prev,
          pincode: cleaned,
          stateName: address.state || '',
          cityName: address.district || '',
          localArea: address.localArea || '',
          countryName: address.country || 'India',
        };
      }
      // Different pincode -> clear until lookup fills them in
      return { ...prev, pincode: cleaned, stateName: '', cityName: '', localArea: '' };
    });

    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: '' }));
    }
  };

  const handleNormalHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setNormalHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const handleClinicHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const handleClinicBreakHoursChange = (day, field, value) => {
    const dayKey = day.toLowerCase();
    setClinicBreakHours(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  };

  const toggle247Mode = () => {
    if (!is24x7) {
      if (workingHourType === "normal") {
        const newHours = {};
        DAYS.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false };
        });
        setNormalHours(newHours);
      } else if (workingHourType === "clinic") {
        const newHours = {};
        DAYS.forEach(day => {
          newHours[day.toLowerCase()] = { start: "00:00", end: "23:59", isHoliday: false };
        });
        setClinicHours(newHours);
      } else {
        const newHours = {};
        DAYS.forEach(day => {
          newHours[day.toLowerCase()] = { morningStart: "00:00", morningEnd: "11:59", eveningStart: "12:00", eveningEnd: "23:59", isHoliday: false };
        });
        setClinicBreakHours(newHours);
      }
      setIs24x7(true);
      showSuccessToast('24/7 mode enabled.', 4000);
    } else {
      const defaultNormalHours = {
        monday: { start: "09:00", end: "18:00", isHoliday: false },
        tuesday: { start: "09:00", end: "18:00", isHoliday: false },
        wednesday: { start: "09:00", end: "18:00", isHoliday: false },
        thursday: { start: "09:00", end: "18:00", isHoliday: false },
        friday: { start: "09:00", end: "18:00", isHoliday: false },
        saturday: { start: "09:00", end: "18:00", isHoliday: false },
        sunday: { start: "09:00", end: "18:00", isHoliday: true }
      };
      const defaultClinicHours = {
        monday: { start: "09:00", end: "18:00", isHoliday: false },
        tuesday: { start: "09:00", end: "18:00", isHoliday: false },
        wednesday: { start: "09:00", end: "18:00", isHoliday: false },
        thursday: { start: "09:00", end: "18:00", isHoliday: false },
        friday: { start: "09:00", end: "18:00", isHoliday: false },
        saturday: { start: "09:00", end: "18:00", isHoliday: false },
        sunday: { start: "09:00", end: "18:00", isHoliday: true }
      };
      const defaultClinicBreakHours = {
        monday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        tuesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        wednesday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        thursday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        friday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        saturday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: false },
        sunday: { morningStart: "09:00", morningEnd: "12:00", eveningStart: "16:00", eveningEnd: "20:00", isHoliday: true }
      };

      if (workingHourType === "normal") setNormalHours(defaultNormalHours);
      else if (workingHourType === "clinic") setClinicHours(defaultClinicHours);
      else setClinicBreakHours(defaultClinicBreakHours);

      setIs24x7(false);
      showWarningToast('24/7 mode disabled.', 3000);
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('loading');
    showInfoToast('Getting your current location coordinates...', 2000);
    if (!navigator.geolocation) {
      setLocationStatus('error');
      showErrorToast('Geolocation is not supported by your browser', 4000);
      setTimeout(() => setLocationStatus(''), 3000);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        showSuccessToast(`Coordinates captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 4000);
        setLocationStatus('success');
        setTimeout(() => setLocationStatus(''), 3000);
      },
      (error) => {
        setLocationStatus('error');
        showErrorToast('Failed to get location', 4000);
        setTimeout(() => setLocationStatus(''), 3000);
      }
    );
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    showSuccessToast(`Location coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 3000);
    setLocationStatus('success');
    setTimeout(() => setLocationStatus(''), 3000);
  };

  // ✅ Validation — pincode-based (same as Register.jsx)
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Hospital name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.streetAddress) newErrors.streetAddress = 'Street address is required';

    if (!/^\d{6}$/.test(formData.pincode || '')) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    // If pincode was changed, must resolve to a valid location
    if (
      String(formData.pincode) !== String(originalPincode || '') &&
      (postOffices.length === 0 || !formData.stateName || !formData.cityName)
    ) {
      newErrors.pincode = newErrors.pincode || 'Invalid pincode or no location found';
    }

    if (!formData.stateName) newErrors.stateName = 'State is required';
    if (!formData.cityName) newErrors.cityName = 'District is required';
    if (!formData.localArea) newErrors.localArea = 'Please select your local area';
    if (!formData.hospitalType) newErrors.hospitalType = 'Please select hospital type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertToApiWorkingHours = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const result = [];

    if (workingHourType === "normal") {
      days.forEach(day => {
        const dayData = normalHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          opening_time: dayData?.start || '09:00',
          closing_time: dayData?.end || '18:00'
        });
      });
    } else if (workingHourType === "clinic") {
      days.forEach(day => {
        const dayData = clinicHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          opening_time: dayData?.start || '09:00',
          closing_time: dayData?.end || '18:00'
        });
      });
    } else if (workingHourType === "clinic-break") {
      days.forEach(day => {
        const dayData = clinicBreakHours[day];
        result.push({
          day: day,
          is_holiday: dayData?.isHoliday || false,
          morning_start: dayData?.morningStart || '09:00',
          morning_end: dayData?.morningEnd || '12:00',
          evening_start: dayData?.eveningStart || '16:00',
          evening_end: dayData?.eveningEnd || '20:00'
        });
      });
    }

    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast('Please fix the errors in the form', 3000);
      return;
    }

    setIsSubmitting(true);
    setUpdateError('');
    showInfoToast('Updating hospital information...', 2000);

    const apiWorkingHours = convertToApiWorkingHours();

    const updateData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: {
        country: formData.countryName || 'India',
        state: formData.stateName,
        district: formData.cityName,
        localArea: formData.localArea,
        place: formData.streetAddress,
        pincode: Number(formData.pincode),
      },
      type: formData.hospitalType,
      emergencyContact: formData.emergencyNumber,
      latitude: formData.latitude ? Number(parseFloat(formData.latitude).toFixed(6)) : null,
      longitude: formData.longitude ? Number(parseFloat(formData.longitude).toFixed(6)) : null,
      about: formData.about || "",
      workingHourType: workingHourType,
      workingHoursData: apiWorkingHours
    };

    try {
      await updateHospital({
        id: hospitalData.id,
        updateHospital: updateData
      }).unwrap();

      showSuccessToast(` ${formData.name} has been successfully updated!`, 5000);

      setIsSubmitting(false);

      setTimeout(() => {
        navigate('/super-admin/hospitals');
      }, 2000);

    } catch (error) {
      let errorMessage = "Update failed. Please try again.";
      if (error.data?.message) errorMessage = error.data.message;
      else if (error.status === 409) errorMessage = "Email already registered. Please use a different email.";
      setUpdateError(errorMessage);
      showErrorToast(`❌ ${errorMessage}`, 4000);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderNormalHours = () => {
    return DAYS.map((day) => {
      const dayHours = normalHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dayHours.isHoliday}
                onChange={(e) => handleNormalHoursChange(day, 'isHoliday', e.target.checked)}
                className="w-4 h-4 rounded border-red-400"
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Open Time</label>
                <input
                  type="time"
                  value={dayHours.start}
                  onChange={(e) => handleNormalHoursChange(day, 'start', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Close Time</label>
                <input
                  type="time"
                  value={dayHours.end}
                  onChange={(e) => handleNormalHoursChange(day, 'end', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  const renderClinicHours = () => {
    return DAYS.map((day) => {
      const dayHours = clinicHours[day.toLowerCase()] || { start: "09:00", end: "18:00", isHoliday: false };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dayHours.isHoliday}
                onChange={(e) => handleClinicHoursChange(day, 'isHoliday', e.target.checked)}
                className="w-4 h-4 rounded border-red-400"
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={dayHours.start}
                  onChange={(e) => handleClinicHoursChange(day, 'start', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={dayHours.end}
                  onChange={(e) => handleClinicHoursChange(day, 'end', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  const renderClinicBreakHours = () => {
    return DAYS.map((day) => {
      const dayHours = clinicBreakHours[day.toLowerCase()] || {
        morningStart: "09:00", morningEnd: "12:00",
        eveningStart: "16:00", eveningEnd: "20:00",
        isHoliday: false
      };
      return (
        <div key={day} className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#154A7D] text-lg">{day}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dayHours.isHoliday}
                onChange={(e) => handleClinicBreakHoursChange(day, 'isHoliday', e.target.checked)}
                className="w-4 h-4 rounded border-red-400"
              />
              Holiday
            </label>
          </div>
          {!dayHours.isHoliday ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Morning Session</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="time"
                      value={dayHours.morningStart}
                      onChange={(e) => handleClinicBreakHoursChange(day, 'morningStart', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={dayHours.morningEnd}
                      onChange={(e) => handleClinicBreakHoursChange(day, 'morningEnd', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Evening Session</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="time"
                      value={dayHours.eveningStart}
                      onChange={(e) => handleClinicBreakHoursChange(day, 'eveningStart', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={dayHours.eveningEnd}
                      onChange={(e) => handleClinicBreakHoursChange(day, 'eveningEnd', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154A7D] outline-none text-black font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Closed for the day</p>
          )}
        </div>
      );
    });
  };

  if (!hospitalData) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 font-sans">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">No hospital data found</h2>
          <Button onClick={() => navigate('/super-admin/hospitals')} className="mt-4">
            Back to Hospitals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#154A7D] transition-colors duration-200 group rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Hospitals</span>
            </button>
            <div className="text-sm text-gray-500">
              Super Admin Portal
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-xl bg-[#154A7D] text-white flex items-center justify-center text-2xl font-bold">
                <Building className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Hospital</h1>
              <p className="text-slate-500">Update hospital information and settings</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {updateError && <Alert type="error" message={updateError} />}

              <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#154A7D]" />
                  Basic Information
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Input
                      label="Hospital Name"
                      name="name"
                      placeholder="Enter hospital name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      error={errors.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Hospital Type <span className="text-red-500">*</span></label>
                    <CustomSelect
                      hideLabel
                      icon={Building2}
                      value={formData.hospitalType}
                      options={hospitalTypeOptions}
                      placeholder="Select hospital type"
                      onChange={(value) => handleInputChange({ target: { name: 'hospitalType', value } })}
                      error={errors.hospitalType}
                      touched={!!errors.hospitalType}
                      className={FORM_SELECT_CLASS}
                    />
                    {errors.hospitalType && <p className="mt-1 text-xs text-red-500">{errors.hospitalType}</p>}
                  </div>

                  <div>
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      error={errors.email}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Mobile Number"
                      name="phone"
                      placeholder="Enter mobile number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      error={errors.phone}
                    />
                    <Input
                      label="Emergency Number"
                      name="emergencyNumber"
                      placeholder="Emergency contact (optional)"
                      value={formData.emergencyNumber}
                      onChange={handleInputChange}
                      icon={Phone}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">About Hospital <span className="text-gray-400 text-xs">(optional)</span></label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <textarea
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                      placeholder="Tell us about your hospital - specialties, facilities, mission, etc."
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* ✅ ADDRESS INFORMATION — Pincode API driven (same as Register.jsx) */}
              <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#154A7D]" />
                  Address Information
                </h2>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 flex justify-between">
                    <span>🇮🇳 India</span>
                    <span className="text-green-600 font-medium">✓ Default</span>
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="Enter 6 digit pincode"
                      maxLength={6}
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border ${errors.pincode ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium`}
                    />
                    {isPincodeLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                      </div>
                    )}
                    {!isPincodeLoading && postOffices.length > 0 && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Enter pincode to automatically find your location.
                  </p>
                  {isPincodeLoading && (
                    <p className="text-xs text-blue-600 mt-2">Finding your location...</p>
                  )}
                  {isPincodeError && (
                    <p className="text-xs text-red-500 mt-2">Unable to fetch pincode details. Please try again.</p>
                  )}
                  {formData.pincode.length === 6 && !isPincodeLoading && !isPincodeError && postOffices.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">Invalid pincode or no location found.</p>
                  )}
                  {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      value={formData.stateName}
                      readOnly
                      placeholder="Automatically detected state"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      value={formData.cityName}
                      readOnly
                      placeholder="Automatically detected district"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* Local Area / Place */}
                <SearchableLocalAreaDropdown
                  label="Local Area / Place"
                  options={localAreaOptions}
                  value={formData.localArea}
                  onChange={(name) => setFormData(prev => ({ ...prev, localArea: name }))}
                  placeholder={
                    localAreaOptions.length === 0
                      ? 'Enter pincode first'
                      : 'Select your local area'
                  }
                  required={true}
                  disabled={localAreaOptions.length === 0}
                />
                {errors.localArea && <p className="text-xs text-red-500 -mt-3">{errors.localArea}</p>}

                {/* Street Address */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Street Address *
                  </label>
                  <textarea
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Enter hospital street address"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.streetAddress ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#154A7D] bg-white text-black font-medium resize-none`}
                  />
                  {errors.streetAddress && <p className="mt-1 text-xs text-red-500">{errors.streetAddress}</p>}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#154A7D]" />
                  Location Coordinates
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <Input
                    label="Latitude"
                    name="latitude"
                    placeholder="Enter latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Longitude"
                    name="longitude"
                    placeholder="Enter longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                  />
                </div>
                <GoogleMapsLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={handleLocationSelect}
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationStatus === 'loading'}
                  className={`w-full rounded-xl border py-4 font-medium text-lg flex items-center justify-center gap-3 transition-all duration-200 ${locationStatus === 'loading' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-[#F5FAFF] text-[#154A7D] border-[#D6E2EE] hover:bg-[#154A7D] hover:text-white hover:border-[#154A7D] hover:shadow-md'}`}
                >
                  <Navigation size={22} className={locationStatus === 'loading' ? 'animate-pulse' : ''} />
                  {locationStatus === 'loading' ? 'Getting your location...' : '📍 Get Current Location Coordinates'}
                </button>
                {locationStatus === 'loading' && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#154A7D]"></div>
                    <p className="text-xs text-blue-600 text-center">📍 Fetching your location coordinates...</p>
                  </div>
                )}
                {locationStatus === 'success' && (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-green-600 text-center">✓ Location coordinates captured successfully!</p>
                  </div>
                )}
                {locationStatus === 'error' && (
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-red-600 text-center">❌ Failed to get location. Please enter coordinates manually or use the map.</p>
                  </div>
                )}
              </div>

              {/* ✅ Working Hours Section */}
              <div className="rounded-2xl bg-slate-50 p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={20} className="text-[#154A7D]" />
                      Working Hours
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Select the working hours type for your hospital</p>
                  </div>
                  <button type="button" onClick={toggle247Mode} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${is24x7 ? "bg-[#154A7D] text-white hover:bg-[#0e3a61] hover:shadow-md" : "bg-white hover:bg-[#154A7D] hover:text-white border border-gray-200 hover:border-[#154A7D] text-gray-700"}`}>
                    <Sun size={14} />
                    {is24x7 ? "24/7 Mode: ON" : "Set 24/7 Hours"}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours Type <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    hideLabel
                    icon={Briefcase}
                    value={workingHourType}
                    options={WORKING_HOUR_TYPE_OPTIONS}
                    onChange={(value) => setWorkingHourType(value)}
                    className={FORM_SELECT_CLASS}
                  />
                  <p className="text-xs text-gray-500">
                    {workingHourType === "normal" && "Single session per day (e.g., 9:00 AM - 6:00 PM)"}
                    {workingHourType === "clinic" && "Single session per day without break (e.g., 9:00 AM - 6:00 PM)"}
                    {workingHourType === "clinic-break" && "Two sessions per day with a break (Morning & Evening)"}
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  {workingHourType === "normal" && renderNormalHours()}
                  {workingHourType === "clinic" && renderClinicHours()}
                  {workingHourType === "clinic-break" && renderClinicBreakHours()}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting || isApiLoading}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {isSubmitting || isApiLoading ? 'Saving...' : 'Update Hospital'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHospital;