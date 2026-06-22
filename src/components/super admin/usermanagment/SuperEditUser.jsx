// src/components/superadmin/usermanagement/SuperEditUser.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, X, Stethoscope, Briefcase, Shield, ChevronDown, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button, Card } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useAssignPermissionsMutation } from '../../../../app/service/rolePermission';
import { useGetRolesQuery } from '../../../../app/service/role';
import { getHospitalId } from '../../../utils/auth';

const SuperEditUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRoleType = location.pathname.includes("doctor") ? "doctor" : "staff";
  const hospitalId = getHospitalId();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const doctorDropdownRef = useRef(null);
  const staffDropdownRef = useRef(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [formData, setFormData] = useState({ roleId: '' });
  const [errors, setErrors] = useState({});

  const { data: doctorsData, isLoading: doctorsLoading, refetch: refetchDoctors } = useGetDoctorsQuery({ limit: 1000 });
  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useGetStaffQuery({ limit: 1000 });
  
  // Fetch roles - include both admin and hospital roles
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery({ limit: 1000 });
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();

  const doctorsList = doctorsData?.data || [];
  const staffList = staffData?.data || [];
  
  // Extract roles - include admin role (id=2) and all hospital roles
  const rolesList = [
    ...(rolesData?.admin || []).filter(role => role.id === 2),
    ...(rolesData?.data || [])
  ];

  useEffect(() => {
    if (selectedRoleType === "doctor" && doctorsList.length > 0) {
      setSelectedDoctors(doctorsList.filter(doctor => Number(doctor.roleId) !== 0).map(doctor => String(doctor.id)));
    }
  }, [doctorsList, selectedRoleType]);

  useEffect(() => {
    if (selectedRoleType === "staff" && staffList.length > 0) {
      setSelectedStaff(staffList.filter(staff => Number(staff.roleId) !== 0).map(staff => String(staff.id)));
    }
  }, [staffList, selectedRoleType]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleDoctorCheckbox = (doctorId) => {
    setSelectedDoctors(prev => prev.includes(doctorId) ? prev.filter(id => id !== doctorId) : [...prev, doctorId]);
  };

  const handleSelectAllDoctors = () => {
    setSelectedDoctors(selectedDoctors.length === doctorsList.length ? [] : doctorsList.map(d => String(d.id)));
  };

  const handleStaffCheckbox = (staffId) => {
    setSelectedStaff(prev => prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]);
  };

  const handleSelectAllStaff = () => {
    setSelectedStaff(selectedStaff.length === staffList.length ? [] : staffList.map(s => String(s.id)));
  };

  const validateForm = () => {
    const newErrors = {};
    if (selectedRoleType === 'doctor' && selectedDoctors.length === 0) newErrors.doctors = 'Please select at least one doctor';
    if (selectedRoleType === 'staff' && selectedStaff.length === 0) newErrors.staff = 'Please select at least one staff member';
    if (!formData.roleId) newErrors.roleId = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { showErrorToast('Please fix the errors', 3000); return; }
    
    setIsLoading(true);
    try {
      const roleId = Number(formData.roleId);
      const selectedRoleName = getRoleNameById(roleId);
      
      if (selectedRoleType === 'doctor') {
        const doctorIds = doctorsList.map(doctor => ({ 
          id: doctor.id, 
          roleId: selectedDoctors.includes(String(doctor.id)) ? roleId : 0 
        }));
        await assignPermissions({ 
          hospitalId: hospitalId ? parseInt(hospitalId) : null,
          roleId, 
          userType: "doctor", 
          doctorIds 
        }).unwrap();
        await refetchDoctors();
        showSuccessToast(`${selectedDoctors.length} doctor(s) updated to ${selectedRoleName}!`, 4000);
      } else {
        const staffIds = staffList.map(staff => ({ 
          id: staff.id, 
          roleId: selectedStaff.includes(String(staff.id)) ? roleId : 0 
        }));
        await assignPermissions({ 
          hospitalId: hospitalId ? parseInt(hospitalId) : null,
          roleId, 
          userType: "staff", 
          staffIds 
        }).unwrap();
        await refetchStaff();
        showSuccessToast(`${selectedStaff.length} staff member(s) updated to ${selectedRoleName}!`, 4000);
      }
      
      setIsLoading(false);
      setTimeout(() => navigate('/super-admin/users'), 2000);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to update permissions', 4000);
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate('/super-admin/users');

  const getSelectedDoctorNames = () => selectedDoctors.map(id => { 
    const doctor = doctorsList.find(d => String(d.id) === id); 
    return doctor?.displayName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || doctor?.name; 
  }).filter(Boolean);
  
  const getSelectedStaffNames = () => selectedStaff.map(id => { 
    const staff = staffList.find(s => String(s.id) === id); 
    return staff?.name; 
  }).filter(Boolean);

  const isLoadingData = doctorsLoading || staffLoading || rolesLoading;

  if (isLoadingData) {
    return (<div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1C62A0]" /></div>);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="mb-6">
        <button onClick={() => navigate('/super-admin/users')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} /> Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit {selectedRoleType === "doctor" ? "Doctor" : "Staff"}</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-xl shadow-sm overflow-visible">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">User Information</h2>
            </div>

            <div className="p-6 space-y-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">User Type</label><div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize">{selectedRoleType}</div></div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select name="roleId" value={formData.roleId} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white">
                    <option value="">Select a role</option>
                    {rolesList.map((role) => (<option key={role.id} value={role.id}>{role.name || role.roleName}</option>))}
                  </select>
                </div>
                {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
                {formData.roleId && (<div className="mt-2"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.roleId)}`}>{getRoleNameById(formData.roleId)}</span></div>)}
              </div>

              <div>
                {selectedRoleType === 'doctor' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctors</label>
                    <div className="relative" ref={doctorDropdownRef}>
                      <div onClick={() => setShowDoctorDropdown(!showDoctorDropdown)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between">
                        <span>{selectedDoctors.length === 0 ? 'Select doctors' : `${selectedDoctors.length} doctor(s) selected`}</span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                      {showDoctorDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b p-2"><button type="button" onClick={handleSelectAllDoctors} className="text-sm text-[#1C62A0]">{selectedDoctors.length === doctorsList.length ? 'Deselect All' : 'Select All'}</button></div>
                          {doctorsList.map((doctor) => (
                            <label key={doctor.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={selectedDoctors.includes(String(doctor.id))} onChange={() => handleDoctorCheckbox(String(doctor.id))} className="h-4 w-4 text-[#1C62A0] rounded" />
                              <span className="ml-2 text-sm">{doctor.displayName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name}</span>
                              {doctor.speciality && <span className="text-xs text-gray-400 ml-2">({doctor.speciality})</span>}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedDoctors.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{getSelectedDoctorNames().map((name, idx) => (<span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{name}</span>))}</div>)}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Members</label>
                    <div className="relative" ref={staffDropdownRef}>
                      <div onClick={() => setShowStaffDropdown(!showStaffDropdown)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between">
                        <span>{selectedStaff.length === 0 ? 'Select staff members' : `${selectedStaff.length} staff member(s) selected`}</span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                      {showStaffDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white border-b p-2"><button type="button" onClick={handleSelectAllStaff} className="text-sm text-[#1C62A0]">{selectedStaff.length === staffList.length ? 'Deselect All' : 'Select All'}</button></div>
                          {staffList.map((staff) => (
                            <label key={staff.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={selectedStaff.includes(String(staff.id))} onChange={() => handleStaffCheckbox(String(staff.id))} className="h-4 w-4 text-[#1C62A0] rounded" />
                              <span className="ml-2 text-sm">{staff.name}</span>
                              {staff.designation && <span className="text-xs text-gray-400 ml-2">({staff.designation})</span>}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedStaff.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{getSelectedStaffNames().map((name, idx) => (<span key={idx} className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">{name}</span>))}</div>)}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading || isAssigning}><X size={16} className="mr-2" /> Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isLoading || isAssigning} disabled={isLoading || isAssigning}><Save size={16} className="mr-2" /> {isLoading || isAssigning ? 'Updating...' : `Update ${selectedRoleType === 'doctor' ? selectedDoctors.length : selectedStaff.length} User(s)`}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SuperEditUser;