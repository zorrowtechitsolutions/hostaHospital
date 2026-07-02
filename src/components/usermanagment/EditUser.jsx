// src/components/users/EditUser.jsx - With dynamic roles from API
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Stethoscope,
  Briefcase,
  Shield,
  ChevronDown,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';

import {
  Button,
  Card
} from '../ui';

import {
  showSuccessToast,
  showErrorToast,
  showWarningToast
} from '../ui/Toast';

import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../app/service/role';
import { getHospitalId } from '../../utils/auth';

const EditUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedRoleType = location.pathname.includes("doctor") ? "doctor" : "staff";
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  
  const doctorDropdownRef = useRef(null);
  const staffDropdownRef = useRef(null);
  
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  
  const [formData, setFormData] = useState({
    roleId: ''
  });
  
  const [errors, setErrors] = useState({});

  const hospitalId = getHospitalId();
  
  const { 
    data: doctorsData, 
    isLoading: doctorsLoading,
    error: doctorsError,
    refetch: refetchDoctors
  } = useGetDoctorsQuery({ limit: 100 });
  
  const { 
    data: staffData, 
    isLoading: staffLoading,
    error: staffError,
    refetch: refetchStaff
  } = useGetStaffQuery({ limit: 100 });
  
  const { 
    data: rolesData, 
    isLoading: rolesLoading,
    error: rolesError 
  } = useGetRolesQuery({ limit: 100 });
  
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();

  const doctorsList = doctorsData?.data || doctorsData || [];
  const staffList = staffData?.data || staffData || [];
  
  // AUTO-SELECT DOCTORS WITH roleId !== 0
  useEffect(() => {
    if (selectedRoleType === "doctor" && doctorsList.length > 0) {
      const assignedDoctors = doctorsList
        .filter(doctor => Number(doctor.roleId) !== 0)
        .map(doctor => String(doctor.id));
      
      setSelectedDoctors(assignedDoctors);
    }
  }, [doctorsList, selectedRoleType]);
  
  // AUTO-SELECT STAFF WITH roleId !== 0
  useEffect(() => {
    if (selectedRoleType === "staff" && staffList.length > 0) {
      const assignedStaff = staffList
        .filter(staff => Number(staff.roleId) !== 0)
        .map(staff => String(staff.id));
      
      setSelectedStaff(assignedStaff);
    }
  }, [staffList, selectedRoleType]);

  const rolesList = [
    ...(rolesData?.admin || []).filter(
      role => role.id === 2
    ),
    ...(rolesData?.data || []).filter(
      role => (role.hospitalId) === hospitalId
    )
  ];

  const getRoleNameById = (roleId) => {
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || '';
  };

  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId);
    const roleNameLower = roleName?.toLowerCase();
    if (roleNameLower === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleNameLower === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleNameLower === 'staff') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-700';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setShowDoctorDropdown(false);
      }
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
        setShowStaffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDoctorCheckbox = (doctorId) => {
    setSelectedDoctors(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
  };

  const handleSelectAllDoctors = () => {
    if (selectedDoctors.length === doctorsList.length) {
      setSelectedDoctors([]);
    } else {
      const allDoctorIds = doctorsList.map(d => String(d.id));
      setSelectedDoctors(allDoctorIds);
    }
  };

  const handleStaffCheckbox = (staffId) => {
    setSelectedStaff(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handleSelectAllStaff = () => {
    if (selectedStaff.length === staffList.length) {
      setSelectedStaff([]);
    } else {
      const allStaffIds = staffList.map(s => String(s.id));
      setSelectedStaff(allStaffIds);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedRoleType === 'doctor' && selectedDoctors.length === 0) {
      newErrors.doctors = 'Please select at least one doctor';
    }
    
    if (selectedRoleType === 'staff' && selectedStaff.length === 0) {
      newErrors.staff = 'Please select at least one staff member';
    }
    
    if (!formData.roleId) {
      newErrors.roleId = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showErrorToast('Please fix the errors in the form', 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const hospitalId = getHospitalId();
      
      if (!hospitalId) {
        showErrorToast('Hospital ID not found. Please log in again.', 3000);
        setIsLoading(false);
        return;
      }
      
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);
      
      if (selectedRoleType === 'doctor') {
        const doctorIds = doctorsList.map(doctor => ({
          id: doctor.id,
          roleId: selectedDoctors.includes(String(doctor.id))
            ? roleId
            : 0
        }));
        
        const payload = {
          hospitalId: parseInt(hospitalId),
          roleId,
          userType: "doctor",
          doctorIds
        };
        
        await assignPermissions(payload).unwrap();
        await refetchDoctors();
        
        showSuccessToast(
          `${selectedDoctors.length} doctor(s) have been updated to the ${selectedRoleName} role!`,
          4000,
          {
            'Role': selectedRoleName,
            'Role ID': roleId,
            'Doctors Updated': selectedDoctors.length,
            'Doctors Removed': doctorsList.length - selectedDoctors.length,
            'Status': 'Updated'
          }
        );
        
      } else {
        const staffIds = staffList.map(staff => ({
          id: staff.id,
          roleId: selectedStaff.includes(String(staff.id))
            ? roleId
            : 0
        }));
        
        await assignPermissions({
          hospitalId: parseInt(hospitalId),
          roleId: roleId,
          userType: "staff",
          staffIds: staffIds
        }).unwrap();
        
        await refetchStaff();
        
        showSuccessToast(
          `${selectedStaff.length} staff member(s) have been updated to the ${selectedRoleName} role!`,
          4000,
          {
            'Role': selectedRoleName,
            'Role ID': roleId,
            'Staff Updated': selectedStaff.length,
            'Staff Removed': staffList.length - selectedStaff.length,
            'Status': 'Updated'
          }
        );
      }
      
      setIsLoading(false);
      
      setTimeout(() => {
        navigate('/users');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error?.data?.message || 'Failed to update permissions. Please try again.';
      showErrorToast(errorMessage, 4000);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const getSelectedDoctorNames = () => {
    return selectedDoctors.map(id => {
      const doctor = doctorsList.find(d => String(d.id) === id);
      return doctor?.displayName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || doctor?.name;
    }).filter(Boolean);
  };

  const getSelectedStaffNames = () => {
    return selectedStaff.map(id => {
      const staff = staffList.find(s => String(s.id) === id);
      return staff?.name;
    }).filter(Boolean);
  };

  const isLoadingData = doctorsLoading || staffLoading || rolesLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0] mx-auto mb-3" />
          <p className="text-gray-500">Loading doctors, staff, and roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Header with Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="p-1"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Users</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Edit {selectedRoleType === "doctor" ? "Doctor" : "Staff"}</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Edit {selectedRoleType === "doctor" ? "Doctor" : "Staff"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {selectedRoleType === "doctor" 
            ? "Select doctors and assign roles" 
            : "Select staff members and assign roles"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-xl shadow-sm overflow-visible">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedRoleType === "doctor" 
                  ? "Select doctors from the list below and assign them a role" 
                  : "Select staff members from the list below and assign them a role"}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* User Type - Display based on URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Type
                </label>
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize">
                  {selectedRoleType}
                </div>
              </div>

              {/* Assign Role - Dynamic dropdown from API */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select a role</option>
                    {rolesList.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
                {formData.roleId && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>
                      {getRoleNameById(formData.roleId)}
                    </span>
                  </div>
                )}
              </div>

              {/* Select Doctors / Staff with Checkbox Dropdown */}
              <div>
                {selectedRoleType === 'doctor' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctors <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={doctorDropdownRef}>
                      <div
                        onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                      >
                        <span className="text-gray-700">
                          {selectedDoctors.length === 0 
                            ? 'Select doctors' 
                            : `${selectedDoctors.length} doctor(s) selected`}
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                      
                      {showDoctorDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                            <button
                              type="button"
                              onClick={handleSelectAllDoctors}
                              className="text-sm text-[#1C62A0] hover:text-[#154a7d] font-medium flex items-center gap-2"
                            >
                              {selectedDoctors.length === doctorsList.length ? (
                                <>
                                  <CheckSquare size={16} />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Square size={16} />
                                  Select All
                                </>
                              )}
                            </button>
                          </div>
                          {doctorsList.map((doctor) => (
                            <label
                              key={doctor.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDoctors.includes(String(doctor.id))}
                                onChange={() => handleDoctorCheckbox(String(doctor.id))}
                                className="h-4 w-4 text-[#1C62A0] rounded border-gray-300 focus:ring-[#1C62A0]"
                              />
                              <div className="ml-2 flex-1">
                                <span className="text-sm text-gray-700">
                                  {doctor.displayName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name || 'Doctor'}
                                </span>
                                {doctor.speciality && (
                                  <span className="text-xs text-gray-400 ml-2">({doctor.speciality})</span>
                                )}
                                {doctor.roleId && Number(doctor.roleId) !== 0 && (
                                  <span className="text-xs text-green-600 ml-2">(Current Role ID: {doctor.roleId})</span>
                                )}
                              </div>
                            </label>
                          ))}
                          {doctorsList.length === 0 && (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              No doctors found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.doctors && <p className="mt-1 text-xs text-red-500">{errors.doctors}</p>}
                    {selectedDoctors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getSelectedDoctorNames().map((name, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Staff Members <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={staffDropdownRef}>
                      <div
                        onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                      >
                        <span className="text-gray-700">
                          {selectedStaff.length === 0 
                            ? 'Select staff members' 
                            : `${selectedStaff.length} staff member(s) selected`}
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                      
                      {showStaffDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                            <button
                              type="button"
                              onClick={handleSelectAllStaff}
                              className="text-sm text-[#1C62A0] hover:text-[#154a7d] font-medium flex items-center gap-2"
                            >
                              {selectedStaff.length === staffList.length ? (
                                <>
                                  <CheckSquare size={16} />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Square size={16} />
                                  Select All
                                </>
                              )}
                            </button>
                          </div>
                          {staffList.map((staff) => (
                            <label
                              key={staff.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStaff.includes(String(staff.id))}
                                onChange={() => handleStaffCheckbox(String(staff.id))}
                                className="h-4 w-4 text-[#1C62A0] rounded border-gray-300 focus:ring-[#1C62A0]"
                              />
                              <div className="ml-2 flex-1">
                                <span className="text-sm text-gray-700">{staff.name}</span>
                                {staff.designation && (
                                  <span className="text-xs text-gray-400 ml-2">({staff.designation})</span>
                                )}
                                {staff.roleId && Number(staff.roleId) !== 0 && (
                                  <span className="text-xs text-green-600 ml-2">(Current Role ID: {staff.roleId})</span>
                                )}
                              </div>
                            </label>
                          ))}
                          {staffList.length === 0 && (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              No staff members found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.staff && <p className="mt-1 text-xs text-red-500">{errors.staff}</p>}
                    {selectedStaff.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getSelectedStaffNames().map((name, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
                disabled={isLoading || isAssigning}
              >
                <X size={16} />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading || isAssigning}
                leftIcon={<Save size={16} />}
                className="flex items-center gap-2"
                disabled={isLoading || isAssigning}
              >
                {isLoading || isAssigning ? 'Updating...' : `Update ${selectedRoleType === 'doctor' ? selectedDoctors.length : selectedStaff.length} User(s)`}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditUser;