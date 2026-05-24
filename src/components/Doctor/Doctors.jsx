// src/components/Doctor/Doctors.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import DeleteDoctor from "./DeleteDoctor";
import AppointmentManagement from "./AppointmentManagment";
import { Badge, Modal } from '../ui';
import { useGetDoctorsQuery } from "../../../app/service/doctorApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// S3 Configuration
const S3_BASE_URL = "https://hostahealthcare.s3.eu-north-1.amazonaws.com";

const getS3ImageUrl = (imageKey) => {
  if (!imageKey) return "";
  if (imageKey.startsWith("http")) {
    return imageKey;
  }
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
};

// Helper functions
const getDoctorName = (doctor) =>
  doctor.displayName || `${doctor.firstName || ""} ${doctor.lastName || ""}`;

const getAppointmentValue = (doctor) =>
  doctor.autoDecline
    ? `${doctor.autoDecline} min`
    : Number(
        doctor.appointmentCount ??
        doctor.appoimentCount ??
        doctor.appointments ??
        0
      );

const getDoctorId = (id) => `#DR${String(id).padStart(4, '0')}`;

// NEW: Helper function to get department display
const getDepartmentDisplay = (doctor) => {
  // Priority: department field first
  if (doctor.department) {
    return doctor.department;
  }
  // Fallback to specialty if department not available
  if (doctor.specialist) {
    return doctor.specialist;
  }
  if (doctor.specialty) {
    return doctor.specialty;
  }
  return 'Department not specified';
};

// Helper function to get specialty (for secondary display if needed)
const getSpecialtyDisplay = (doctor) => {
  if (doctor.specialist && doctor.specialist !== doctor.department) {
    return doctor.specialist;
  }
  if (doctor.specialty && doctor.specialty !== doctor.department) {
    return doctor.specialty;
  }
  return null;
};

// Reusable Doctor Action Menu Component
const DoctorActionMenu = React.memo(({ doctor, activeMenu, onView, onEdit, onDelete, onAppointment }) => {
  if (activeMenu !== doctor.id) return null;
  
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
      <button 
        onClick={() => onView(doctor)} 
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details
      </button>
      <button 
        onClick={() => onAppointment(doctor)} 
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Appointment Settings
      </button>
      <button 
        onClick={() => onEdit(doctor)} 
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button 
        onClick={() => onDelete(doctor)} 
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  );
});

// Skeleton Loader Component
const DoctorSkeletonLoader = ({ viewMode = 'grid', itemsPerPage = 10 }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm">
            <div className="w-full flex justify-between items-start mb-4">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(itemsPerPage)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                   </td>
                ))}
               </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Doctors = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('doctorViewMode') || 'grid';
  });
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [showAppointmentManagement, setShowAppointmentManagement] = useState(false);
  const [selectedDoctorForManagement, setSelectedDoctorForManagement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef(null);

  const {
    data: response,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetDoctorsQuery();

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('doctorViewMode', viewMode);
  }, [viewMode]);

  // Normalize doctor data with imageUrl
  const doctors = useMemo(() => {
    if (!response?.data) return [];
    return response.data.map((doctor) => ({
      ...doctor,
      imageUrl: doctor.imageUrl || doctor.profileImage || doctor.photo || null,
    }));
  }, [response?.data]);

  // Get unique departments (changed from specialties)
  const departments = useMemo(() => {
    const departmentSet = new Set(
      doctors
        .map((d) => d.department)
        .filter(Boolean)
    );
    return ['All', ...Array.from(departmentSet)];
  }, [doctors]);

  // Handle location state for department filter (changed from speciality)
  useEffect(() => {
    if (location.state?.department) {
      setSelectedSpecialty(location.state.department);
      // Clear location state to prevent re-filtering on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSpecialty, filterStatus]);

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu !== null && !event.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenu]);

  // Filter doctors based on all criteria - Updated to use department
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      // Search filter - search by name, department, and specialty
      const doctorName = getDoctorName(doctor).toLowerCase();
      const doctorDepartment = (doctor.department || '').toLowerCase();
      const doctorSpecialty = (doctor.specialist || doctor.specialty || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        doctorName.includes(searchLower) || 
        doctorDepartment.includes(searchLower) ||
        doctorSpecialty.includes(searchLower);

      // Department filter (changed from specialty)
      const matchesDepartment = selectedSpecialty === 'All' || 
        doctor.department === selectedSpecialty;

      // Status filter
      const matchesStatus = filterStatus === "All" ||
        (filterStatus === "Active" && doctor.isActive) ||
        (filterStatus === "Inactive" && !doctor.isActive);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [doctors, searchTerm, selectedSpecialty, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDoctors, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid data format: Expected an array');
        }

        // Here you would typically call an API endpoint to import
        // For now, we'll just show a success message
        console.log('Imported doctors:', importedData);
        alert(`${importedData.length} doctors imported successfully!`);
        refetch();
      } catch (error) {
        alert('Error parsing JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  }, [refetch]);

  const handleExport = useCallback(() => {
    const exportData = filteredDoctors.map(doctor => ({
      'ID': doctor.id,
      'Name': getDoctorName(doctor),
      'Department': doctor.department,
      'Specialty': doctor.specialist || doctor.specialty,
      'Experience': doctor.experience,
      'Appointments': getAppointmentValue(doctor),
      'Email': doctor.email,
      'Phone': doctor.phone,
      'Status': doctor.isActive ? 'Active' : 'Inactive',
      'DOB': doctor.dob,
      'Gender': doctor.gender,
      'Registration Number': doctor.registrationNumber,
      'Known Languages': doctor.knownLanguages,
      'About': doctor.about,
      'Address': doctor.address,
      'Country': doctor.country,
      'State': doctor.state,
      'City': doctor.city,
      'Pin Code': doctor.pinCode,
      'Display Name': doctor.displayName,
      'Username': doctor.userName
    }));
    
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `doctors_export_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  }, [filteredDoctors]);

  const handleRefresh = useCallback(() => {
    setSearchTerm('');
    setSelectedSpecialty('All');
    setFilterStatus('All');
    setActiveMenu(null);
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const handleViewDetails = useCallback((doctor) => {
    navigate(`/doctor/${doctor.id}`);
    setActiveMenu(null);
  }, [navigate]);

  const handleEdit = useCallback((doctor) => {
    navigate(`/edit-doctor/${doctor.id}`);
    setActiveMenu(null);
  }, [navigate]);

  const handleAppointmentManagement = useCallback((doctor) => {
    setSelectedDoctorForManagement(doctor);
    setShowAppointmentManagement(true);
    setActiveMenu(null);
  }, []);

  const handleDeleteClick = useCallback((doctor) => {
    setDoctorToDelete(doctor);
    setShowDelete(true);
    setActiveMenu(null);
  }, []);

  const handleDeleteDoctor = useCallback(async (deletedDoctorId) => {
    await refetch();
    setActiveMenu(null);
    setDoctorToDelete(null);
  }, [refetch]);

  const handleSaveAppointmentSettings = useCallback(async (settings) => {
    // Here you would typically call an API endpoint
    // For now, we'll just store in localStorage as a fallback
    const existingSettings = JSON.parse(localStorage.getItem('appointmentSettings') || '{}');
    existingSettings[settings.doctorId] = settings;
    localStorage.setItem('appointmentSettings', JSON.stringify(existingSettings));
    await refetch();
  }, [refetch]);

  const toggleMenu = useCallback((id, e) => {
    e.stopPropagation();
    setActiveMenu(prevActive => prevActive === id ? null : id);
  }, []);

  const clearDepartmentFilter = useCallback(() => {
    setSelectedSpecialty('All');
  }, []);

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Doctors</h3>
          <p className="text-gray-500 mb-4">Failed to load doctor data. Please try again.</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154A7D]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || (isFetching && doctors.length === 0)) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-sm">
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <DoctorSkeletonLoader viewMode={viewMode} itemsPerPage={itemsPerPage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Doctors</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Doctors</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Doctors</h1>
        {selectedSpecialty !== 'All' && (
          <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            <span>Filtering by department: <strong>{selectedSpecialty}</strong></span>
            <button onClick={clearDepartmentFilter} className="hover:text-blue-900" aria-label="Clear filter">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, department, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-[#1C62A0] p-1 rounded" aria-label="Search">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Department Filter Dropdown - Changed from Specialty */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            aria-label="Filter by department"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-gray-200 rounded-md bg-white mr-2">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-l-md transition-colors ${viewMode === 'grid' ? 'bg-[#1C62A0] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-r-md transition-colors ${viewMode === 'list' ? 'bg-[#1C62A0] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button 
            onClick={handleRefresh} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isFetching}
            aria-label="Refresh"
          >
            <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" aria-label="Import">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 transition-colors" aria-label="Export">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <Link to="/add-doctor" className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2 hover:bg-[#154A7D] transition-colors">
            <span className="text-lg">+</span> New Doctor
          </Link>
        </div>
      </div>

      {isFetching && doctors.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-md px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1C62A0]"></div>
          <span className="text-sm text-gray-600">Updating...</span>
        </div>
      )}

      {/* GRID VIEW - Updated to show Department instead of Specialty */}
      {viewMode === 'grid' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-lg border border-gray-100 p-5 relative flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full flex justify-between items-start mb-4">
                  <Badge variant="info" className="text-[10px]">
                    {getDoctorId(doctor.id)}
                  </Badge>
                  <div className="relative menu-container">
                    <button 
                      onClick={(e) => toggleMenu(doctor.id, e)} 
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                      aria-label="Actions menu"
                    >
                      ⋮
                    </button>
                    <DoctorActionMenu
                      doctor={doctor}
                      activeMenu={activeMenu}
                      onView={handleViewDetails}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onAppointment={handleAppointmentManagement}
                    />
                  </div>
                </div>
                <div className="relative mb-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={getS3ImageUrl(doctor.imageUrl)}
                      alt={getDoctorName(doctor)}
                    />
                    <AvatarFallback>
                      {(doctor.firstName?.[0] || "D").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                      doctor.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <h3 
                  onClick={() => handleViewDetails(doctor)} 
                  className="text-[14px] font-bold text-gray-800 cursor-pointer hover:text-[#1C62A0] transition-colors"
                >
                  {getDoctorName(doctor)}
                </h3>
                {/* CHANGED: Display Department instead of Specialty */}
                <p className="text-[11px] text-gray-500 mb-4">{getDepartmentDisplay(doctor)}</p>
                <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-4 mb-4">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Experience</p>
                    <p className="text-xs font-bold text-gray-700">{doctor.experience || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                      {doctor.autoDecline ? "Auto Decline" : "Appointments"}
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      {getAppointmentValue(doctor)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className={`px-4 py-2 border rounded-md text-sm transition-all ${
                    currentPage === 1 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-[#1C62A0] text-white rounded-md text-sm font-medium">
                  {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className={`px-4 py-2 border rounded-md text-sm transition-all ${
                    currentPage === totalPages 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* LIST VIEW - Updated to show Department instead of Specialty */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Total Doctors
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                {filteredDoctors.length}
              </span>
            </h2>
            {filteredDoctors.length > 0 && (
              <p className="text-xs text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Doctor ID</th>
                  <th className="px-6 py-3">Doctor Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Qualification</th>
                  <th className="px-6 py-3">Experience</th>
                  <th className="px-6 py-3">Appointments</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-[#1C62A0] font-medium">
                      {getDoctorId(doctor.id)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={getS3ImageUrl(doctor.imageUrl)}
                            alt={getDoctorName(doctor)}
                          />
                          <AvatarFallback>
                            {(doctor.firstName?.[0] || "D").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          onClick={() => handleViewDetails(doctor)} 
                          className="font-medium text-gray-800 cursor-pointer hover:text-[#1C62A0] transition-colors"
                        >
                          {getDoctorName(doctor)}
                        </span>
                      </div>
                    </td>
                    {/* CHANGED: Display Department instead of Specialty */}
                    <td className="px-6 py-4 text-gray-600">{getDepartmentDisplay(doctor)}</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.qualification || 'MBBS'}</td>
                    <td className="px-6 py-4 text-gray-600">{doctor.experience || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{getAppointmentValue(doctor)}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={doctor.isActive ? "success" : "danger"}
                        className="text-xs"
                      >
                        {doctor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right relative menu-container">
                      <button 
                        onClick={(e) => toggleMenu(doctor.id, e)} 
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
                        aria-label="Actions menu"
                      >
                        ⋮
                      </button>
                      <DoctorActionMenu
                        doctor={doctor}
                        activeMenu={activeMenu}
                        onView={handleViewDetails}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onAppointment={handleAppointmentManagement}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDoctors.length > 0 && totalPages > 1 && (
            <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center flex-wrap gap-2">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === 1 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                  {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === totalPages 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredDoctors.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154A7D] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      <DeleteDoctor
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDoctorToDelete(null);
        }}
        doctorId={doctorToDelete?.id}
        doctorName={doctorToDelete ? getDoctorName(doctorToDelete) : ''}
        doctorSpecialty={doctorToDelete?.specialist || doctorToDelete?.specialty}
        onDelete={handleDeleteDoctor}
      />

      <AppointmentManagement
        isOpen={showAppointmentManagement}
        onClose={() => {
          setShowAppointmentManagement(false);
          setSelectedDoctorForManagement(null);
        }}
        onSave={handleSaveAppointmentSettings}
        doctor={selectedDoctorForManagement}
        refetchDoctors={refetch}
      />
    </div>
  );
};

export default Doctors;