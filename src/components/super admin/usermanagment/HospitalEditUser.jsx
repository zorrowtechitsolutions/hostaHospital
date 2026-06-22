// src/components/superadmin/usermanagement/HospitalEditUser.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
  Loader2,
  Building2,
  User,
  Mail,
  Phone
} from 'lucide-react';

import {
  Button,
  Card
} from '../../ui';

import {
  showSuccessToast,
  showErrorToast
} from '../../ui/Toast';

import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../../app/service/role';
import { useGetAllHospitalsQuery } from '../../../../app/service/hospitalApi';

const HospitalEditUser = () => {
  const { hospitalId, userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: initialUser, userType: initialUserType, hospitalName: initialHospitalName } = location.state || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState(initialUserType || 'doctor');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId || '');
  const [selectedHospitalName, setSelectedHospitalName] = useState(initialHospitalName || '');
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  
  const hospitalDropdownRef = useRef(null);
  const doctorDropdownRef = useRef(null);
  const staffDropdownRef = useRef(null);
  
  // For editing a specific user, we pre-select them
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [formData, setFormData] = useState({ 
    roleType: selectedRoleType, 
    roleId: initialUser?.roleId || '' 
  });
  const [errors, setErrors] = useState({});

  // Fetch all hospitals for dropdown
  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const hospitals = hospitalsData?.data || hospitalsData || [];

  // Fetch doctors and staff based on selected hospital
  const { data: doctorsData, isLoading: doctorsLoading, refetch: refetchDoctors } = useGetDoctorsQuery({ 
    hospitalId: selectedHospitalId,
    limit: 1000 
  }, { skip: !selectedHospitalId });
  
  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useGetStaffQuery({ 
    hospitalId: selectedHospitalId,
    limit: 1000 
  }, { skip: !selectedHospitalId });
  
  // Fetch roles - include admin roles as well
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery({ 
    hospitalId: selectedHospitalId,
    limit: 1000 
  }, { skip: !selectedHospitalId });
  
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();

  const doctorsList = doctorsData?.data || [];
  const staffList = staffData?.data || [];
  
  // Extract roles - include both hospital-specific roles and admin role
  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || []).filter(role => (role.hospitalId) === parseInt(selectedHospitalId))
  ];

  // Pre-select the user being edited
  useEffect(() => {
    if (initialUser && selectedHospitalId) {
      if (selectedRoleType === 'doctor') {
        setSelectedDoctors([String(initialUser.id)]);
      } else {
        setSelectedStaff([String(initialUser.id)]);
      }
      // Set the current role ID
      if (initialUser.roleId) {
        setFormData(prev => ({ ...prev, roleId: String(initialUser.roleId) }));
      }
    }
  }, [initialUser, selectedHospitalId, selectedRoleType]);

  // Refetch when hospital changes
  useEffect(() => {
    if (selectedHospitalId) {
      refetchDoctors();
      refetchStaff();
    }
  }, [selectedHospitalId]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target)) setShowHospitalDropdown(false);
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) setShowDoctorDropdown(false);
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) setShowStaffDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleHospitalSelect = (hospital) => {
    setSelectedHospitalId(String(hospital.id));
    setSelectedHospitalName(hospital.name);
    setShowHospitalDropdown(false);
    // Reset selections when hospital changes
    setSelectedDoctors([]);
    setSelectedStaff([]);
    setFormData(prev => ({ ...prev, roleId: '' }));
  };

  const handleRoleTypeChange = (e) => {
    const type = e.target.value;
    setSelectedRoleType(type);
    setFormData(prev => ({ ...prev, roleType: type, roleId: '' }));
    setSelectedDoctors([]);
    setSelectedStaff([]);
  };

  const handleDoctorCheckbox = (doctorId) => {
    setSelectedDoctors(prev => prev.includes(doctorId) ? prev.filter(id => id !== doctorId) : [...prev, doctorId]);
  };

  const handleSelectAllDoctors = () => {
    if (selectedDoctors.length === doctorsList.length) {
      setSelectedDoctors([]);
    } else {
      setSelectedDoctors(doctorsList.map(d => String(d.id)));
    }
  };

  const handleStaffCheckbox = (staffId) => {
    setSelectedStaff(prev => prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]);
  };

  const handleSelectAllStaff = () => {
    if (selectedStaff.length === staffList.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staffList.map(s => String(s.id)));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedHospitalId) newErrors.hospital = 'Please select a hospital';
    if (selectedRoleType === 'doctor' && selectedDoctors.length === 0) newErrors.doctors = 'Please select at least one doctor';
    if (selectedRoleType === 'staff' && selectedStaff.length === 0) newErrors.staff = 'Please select at least one staff member';
    if (!formData.roleId) newErrors.roleId = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRoleNameById = (roleId) => {
    if (!roleId || roleId === 0) return 'No Role';
    const role = rolesList.find(r => String(r.id) === String(roleId));
    return role?.name || role?.roleName || 'Unknown Role';
  };

  const getRoleBadgeColor = (roleId) => {
    const roleName = getRoleNameById(roleId)?.toLowerCase();
    if (roleName === 'no role') return 'bg-gray-100 text-gray-500';
    if (roleName === 'admin') return 'bg-purple-100 text-purple-800';
    if (roleName === 'doctor') return 'bg-blue-100 text-blue-800';
    if (roleName === 'staff') return 'bg-green-100 text-green-800';
    if (roleName === 'receptionist') return 'bg-yellow-100 text-yellow-800';
    if (roleName === 'nurse') return 'bg-pink-100 text-pink-800';
    if (roleName === 'pharmacist') return 'bg-indigo-100 text-indigo-800';
    if (roleName === 'lab technician') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-700';
  };

  // Get current user info
  const currentUser = selectedRoleType === 'doctor' 
    ? doctorsList.find(d => String(d.id) === selectedDoctors[0])
    : staffList.find(s => String(s.id) === selectedStaff[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorToast('Please fix the errors in the form', 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);
      
      if (selectedRoleType === 'doctor') {
        // For editing, send all doctors with updated role for the selected one
        const doctorIds = doctorsList.map(doctor => ({
          id: doctor.id,
          roleId: selectedDoctors.includes(String(doctor.id)) ? roleId : (doctor.roleId || 0)
        }));
        
        await assignPermissions({ 
          hospitalId: parseInt(selectedHospitalId),
          roleId: roleId, 
          userType: "doctor", 
          doctorIds 
        }).unwrap();
        
        showSuccessToast(`${selectedDoctors.length} doctor(s) have been updated to the ${selectedRoleName} role!`, 4000);
      } else {
        const staffIds = staffList.map(staff => ({
          id: staff.id,
          roleId: selectedStaff.includes(String(staff.id)) ? roleId : (staff.roleId || 0)
        }));
        
        await assignPermissions({ 
          hospitalId: parseInt(selectedHospitalId),
          roleId: roleId, 
          userType: "staff", 
          staffIds 
        }).unwrap();
        
        showSuccessToast(`${selectedStaff.length} staff member(s) have been updated to the ${selectedRoleName} role!`, 4000);
      }
      
      setIsLoading(false);
      setTimeout(() => {
        navigate(`/super-admin/hospital-users/${selectedHospitalId}/users`, { 
          state: { hospitalName: selectedHospitalName, hospitalId: selectedHospitalId } 
        });
      }, 2000);
    } catch (error) {
      console.error('Error updating permissions:', error);
      showErrorToast(error?.data?.message || 'Failed to update permissions.', 4000);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedHospitalId) {
      navigate(`/super-admin/hospital-users/${selectedHospitalId}/users`, { 
        state: { hospitalName: selectedHospitalName, hospitalId: selectedHospitalId } 
      });
    } else {
      navigate('/super-admin/hospital-users');
    }
  };

  const isLoadingData = loadingHospitals || doctorsLoading || staffLoading || rolesLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1C62A0] mx-auto mb-3" />
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="secondary" size="sm" onClick={handleCancel} className="p-1">
            <ArrowLeft size={20} />
          </Button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Hospital Users</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Edit User</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Edit User Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">Update role assignments for users</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
              <p className="text-sm text-gray-500 mt-1">Select hospital, user, and assign new role</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Hospital Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hospital <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={hospitalDropdownRef}>
                  <div
                    onClick={() => setShowHospitalDropdown(!showHospitalDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-gray-400" />
                      <span className={selectedHospitalName ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedHospitalName || 'Select a hospital'}
                      </span>
                    </div>
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                  
                  {showHospitalDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {hospitals.map((hospital) => (
                        <div
                          key={hospital.id}
                          onClick={() => handleHospitalSelect(hospital)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{hospital.name}</span>
                          </div>
                          {selectedHospitalId === String(hospital.id) && (
                            <CheckSquare size={16} className="text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.hospital && <p className="mt-1 text-xs text-red-500">{errors.hospital}</p>}
              </div>

              {/* User Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={selectedRoleType}
                    onChange={handleRoleTypeChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white appearance-none"
                    disabled={!selectedHospitalId}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {selectedRoleType === 'doctor' ? <Stethoscope size={18} className="text-gray-400" /> : <Briefcase size={18} className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {/* Display Current User Info (if editing a specific user) */}
              {currentUser && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Current User</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-600" />
                      <span className="text-sm text-gray-700">{currentUser.displayName || currentUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-blue-600" />
                      <span className="text-sm text-gray-700">Current Role: {getRoleNameById(currentUser.roleId)}</span>
                    </div>
                    {currentUser.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-blue-600" />
                        <span className="text-sm text-gray-500">{currentUser.email}</span>
                      </div>
                    )}
                    {currentUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-blue-600" />
                        <span className="text-sm text-gray-500">{currentUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assign Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign New Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
                    disabled={!selectedHospitalId}
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

              {/* Select Doctors / Staff - Only show if hospital selected */}
              {selectedHospitalId && (
                <div>
                  {selectedRoleType === 'doctor' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctors <span className="text-red-500">*</span></label>
                      <div className="relative" ref={doctorDropdownRef}>
                        <div
                          onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between"
                        >
                          <span>
                            {selectedDoctors.length === 0 
                              ? 'Select doctors' 
                              : `${selectedDoctors.length} doctor(s) selected`}
                          </span>
                          <ChevronDown size={18} className="text-gray-400" />
                        </div>
                        {showDoctorDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-2">
                              <button type="button" onClick={handleSelectAllDoctors} className="text-sm text-[#1C62A0]">
                                {selectedDoctors.length === doctorsList.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            {doctorsList.map((doctor) => (
                              <label key={doctor.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedDoctors.includes(String(doctor.id))} 
                                  onChange={() => handleDoctorCheckbox(String(doctor.id))} 
                                  className="h-4 w-4 text-[#1C62A0] rounded" 
                                />
                                <span className="ml-2 text-sm">
                                  {doctor.displayName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name}
                                </span>
                                {doctor.speciality && (
                                  <span className="text-xs text-gray-400 ml-2">({doctor.speciality})</span>
                                )}
                                {doctor.roleId && Number(doctor.roleId) !== 0 && (
                                  <span className="text-xs text-green-600 ml-2">Current Role: {getRoleNameById(doctor.roleId)}</span>
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.doctors && <p className="mt-1 text-xs text-red-500">{errors.doctors}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Members <span className="text-red-500">*</span></label>
                      <div className="relative" ref={staffDropdownRef}>
                        <div
                          onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between"
                        >
                          <span>
                            {selectedStaff.length === 0 
                              ? 'Select staff members' 
                              : `${selectedStaff.length} staff member(s) selected`}
                          </span>
                          <ChevronDown size={18} className="text-gray-400" />
                        </div>
                        {showStaffDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-2">
                              <button type="button" onClick={handleSelectAllStaff} className="text-sm text-[#1C62A0]">
                                {selectedStaff.length === staffList.length ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                            {staffList.map((staff) => (
                              <label key={staff.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedStaff.includes(String(staff.id))} 
                                  onChange={() => handleStaffCheckbox(String(staff.id))} 
                                  className="h-4 w-4 text-[#1C62A0] rounded" 
                                />
                                <span className="ml-2 text-sm">{staff.name}</span>
                                {staff.designation && (
                                  <span className="text-xs text-gray-400 ml-2">({staff.designation})</span>
                                )}
                                {staff.roleId && Number(staff.roleId) !== 0 && (
                                  <span className="text-xs text-green-600 ml-2">Current Role: {getRoleNameById(staff.roleId)}</span>
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.staff && <p className="mt-1 text-xs text-red-500">{errors.staff}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading || isAssigning}>
                <X size={16} className="mr-2" /> Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isLoading || isAssigning} 
                disabled={isLoading || isAssigning || !selectedHospitalId}
              >
                <Save size={16} className="mr-2" /> 
                {isLoading || isAssigning ? 'Updating...' : 'Update User Permissions'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default HospitalEditUser;