// src/components/staffs/Staffs.jsx - With formatted Staff IDs, skeleton loading
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Users as UsersIcon,
  RefreshCcw,
  Upload,
  Trash2
} from 'lucide-react';

import {
  Button,
  Card,
  Badge,
  SearchBar,
  Modal
} from '../ui';

import DeleteModal from '../patients/DeleteModel';

import {
  useGetStaffQuery,
  useDeleteStaffMutation
} from '../../../app/service/staffApi';

import {
  showSuccessToast,
  showErrorToast
} from '../ui/Toast';

// Default profile image URL
const DEFAULT_PROFILE_IMAGE = "https://randomuser.me/api/portraits/lego/1.jpg";

const Staffs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  const [designationFilter, setDesignationFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API Hooks - hospitalId is automatically injected by the API service
  const {
    data: staffApiResponse,
    isLoading: loading,
    refetch,
    isFetching
  } = useGetStaffQuery(); // No need to pass hospitalId!

  const [deleteStaff] = useDeleteStaffMutation();

  // Helper function to format staff ID
  const formatStaffId = (id) => {
    if (!id) return '#SF0000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#SF${String(numericId).padStart(4, '0')}`;
  };

  // Transform API response to match the expected format
  const transformStaffData = (staffList) => {
    if (!staffList || !Array.isArray(staffList)) return [];
    
    return staffList.map((staff, index) => ({
      id: staff.id,
      formattedId: formatStaffId(staff.id || index + 1),
      originalId: staff.id || staff._id,
      name: staff.name || '',
      firstName: staff.name?.split(' ')[0] || '',
      lastName: staff.name?.split(' ').slice(1).join(' ') || '',
      gender: staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : '',
      designation: staff.designation || '',
      phone: staff.phone || '',
      email: staff.email || '',
      appointmentDate: staff.createdAt?.split('T')[0] || staff.joiningDate || new Date().toISOString().split('T')[0],
      appointmentDateDisplay: staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      patientsCount: Math.floor(Math.random() * 200) + 10,
      profileImage: staff.profileImage || null,
      status: staff.status === 'inactive' ? 'Inactive' : 'Active',
      jobType: staff.jobType || '',
      dob: staff.dob ? new Date(staff.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '',
      address: staff.address ? `${staff.address.place || ''}, ${staff.address.district || ''}, ${staff.address.state || ''}` : '',
      joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      department: staff.designation || '',
      staffType: staff.staffType || ''
    }));
  };

  const staffsData = transformStaffData(staffApiResponse?.data || []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, designationFilter, genderFilter, dateFilter]);

  const getAllDesignations = () => {
    const designations = [...new Set(staffsData.map(s => s.designation).filter(Boolean))];
    return designations.sort();
  };

  const getFilteredStaffs = () => {
    let filtered = [...staffsData];
    if (searchTerm) {
      filtered = filtered.filter(staff => 
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.formattedId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.includes(searchTerm) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (designationFilter !== 'all') {
      filtered = filtered.filter(staff => staff.designation === designationFilter);
    }
    if (genderFilter !== 'all') {
      filtered = filtered.filter(staff => staff.gender.toLowerCase() === genderFilter.toLowerCase());
    }
    if (dateFilter) {
      filtered = filtered.filter(staff => staff.appointmentDate === dateFilter);
    }
    return filtered;
  };

  const filteredStaffs = getFilteredStaffs();
  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaffs = filteredStaffs.slice(startIndex, startIndex + itemsPerPage);

  const clearAllFilters = () => {
    setDesignationFilter('all');
    setGenderFilter('all');
    setDateFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    clearAllFilters();
    refetch();
    showSuccessToast("Refreshed staff list", 2000);
  };

  const handleExport = () => {
    const exportData = getFilteredStaffs().map(staff => ({
      'Staff ID': staff.formattedId,
      'Staff Name': staff.name,
      'Gender': staff.gender,
      'Designation': staff.designation,
      'Phone Number': staff.phone,
      'Email': staff.email,
      'Appointment Date': staff.appointmentDateDisplay,
      'Department': staff.department,
      'Status': staff.status,
      'Joining Date': staff.joiningDate
    }));
    
    const link = document.createElement('a');
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    link.href = URL.createObjectURL(blob);
    link.download = `staffs_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showSuccessToast(`Exported ${exportData.length} staff records`, 2000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        showSuccessToast(`Successfully imported ${importedData.length} staff members! (Note: Import to API requires additional implementation)`, 3000);
        refetch();
      } catch (error) {
        showErrorToast('Error parsing JSON file. Please make sure it\'s a valid JSON file.', 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

  const handleEditStaff = (staff) => {
    const encodedId = encodeURIComponent(staff.id);
    navigate(`/edit-staff/${encodedId}`, { state: { staff } });
  };

  const handleDeleteClick = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (staffToDelete) {
      try {
        await deleteStaff(staffToDelete.id).unwrap();
        showSuccessToast(`${staffToDelete.name} has been deleted successfully!`, 2000);
        refetch();
        setShowDeleteModal(false);
        setStaffToDelete(null);
      } catch (error) {
        console.error('Delete error:', error);
        showErrorToast(error?.data?.message || 'Failed to delete staff member', 3000);
      }
    }
  };

  const handleAddStaff = () => navigate('/add-staff');
  
  const getActiveFilterCount = () =>
    [
      designationFilter !== 'all',
      genderFilter !== 'all',
      !!dateFilter,
      !!searchTerm
    ].filter(Boolean).length;

  const StaffDetailsModal = ({ staff, onClose }) => {
    if (!staff) return null;
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Staff Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={staff.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={staff.name}
            className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-lg">{staff.name}</h3>
              <span className="text-xs text-gray-500">{staff.formattedId}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-500">Designation</label><p className="text-sm text-gray-800">{staff.designation}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Department</label><p className="text-sm text-gray-800">{staff.department || 'N/A'}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Gender</label><p className="text-sm text-gray-800">{staff.gender}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Phone</label><p className="text-sm text-gray-800">{staff.phone}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Email</label><p className="text-sm text-gray-800">{staff.email}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Joining Date</label><p className="text-sm text-gray-800">{staff.joiningDate}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Date of Birth</label><p className="text-sm text-gray-800">{staff.dob}</p></div>
          <div><label className="block text-xs font-medium text-gray-500">Status</label><Badge variant={staff.status === 'Active' ? 'success' : 'warning'}>{staff.status}</Badge></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-500">Address</label><p className="text-sm text-gray-800">{staff.address}</p></div>
        </div>
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button variant="primary" onClick={() => { handleEditStaff(staff); onClose(); }} fullWidth>Edit Staff</Button>
        </div>
      </Modal>
    );
  };

  const RowActionMenu = ({ staff }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
      <div className="relative inline-block" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(prev => !prev)} className="p-2">
          <MoreVertical size={18} />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button onClick={() => { handleViewDetails(staff); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg">
              <Eye size={16} /> View Details
            </button>
            <button onClick={() => { handleEditStaff(staff); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Edit size={16} /> Edit
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { handleDeleteClick(staff); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-28 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <th key={i} className="px-6 py-3">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Staffs</span><span className="mx-1 text-gray-400">»</span>
              <span>Home</span><span className="mx-1 text-gray-400">»</span><span>Staffs</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Staffs</h1>
        </div>

        {/* Search and Action Buttons Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <SearchBar 
              placeholder="Search by name, staff ID, designation or phone..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
              onClear={() => setSearchTerm('')} 
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
              <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
            <input type="file" onChange={handleImport} accept=".json" className="hidden" id="import-file" />
            <label htmlFor="import-file" className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer" title="Import">
              <Upload size={16} />
            </label>
            <Button variant="outline" size="sm" onClick={handleExport} title="Export">
              <Download size={16} />
            </Button>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`relative p-2 border border-gray-200 rounded-md bg-white ${
                showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
              } hover:bg-gray-50`}
              title="Toggle Filters"
            >
              <Filter size={16} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <Button onClick={handleAddStaff} className="flex items-center gap-2">
              <Plus size={16} /> New Staff
            </Button>
          </div>
        </div>

        {/* FILTER SECTION - New UI */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                  <Filter size={18} className="text-[#1C62A0]" />
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                      {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={clearAllFilters} className="text-sm font-medium text-red-500 hover:text-red-600">
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <select
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Designations</option>
                {getAllDesignations().map((des) => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]"
              />
            </div>
          </div>
        )}

        {/* Staff Table */}
        {filteredStaffs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            {(activeFilterCount > 0 || searchTerm) && (
              <button onClick={clearAllFilters} className="text-blue-600 hover:text-blue-700 text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <Card>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Total Staffs 
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredStaffs.length}</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Staff ID</th>
                    <th className="px-6 py-3">Staff Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Phone Number</th>
                    <th className="px-6 py-3">Appointment Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaffs.map((staff, index) => (
                    <tr key={staff.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">{staff.formattedId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={staff.profileImage || DEFAULT_PROFILE_IMAGE}
                            alt={staff.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                          />
                          <span className="font-medium text-gray-800">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{staff.gender}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.designation}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.appointmentDateDisplay}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <RowActionMenu staff={staff} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredStaffs.length ? startIndex + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredStaffs.length)} of {filteredStaffs.length} staffs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 border rounded-md text-sm transition-all ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Staff Details Modal */}
      {showDetailsModal && selectedStaff && <StaffDetailsModal staff={selectedStaff} onClose={() => setShowDetailsModal(false)} />}

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Staff Member" 
        message="Are you sure you want to delete this staff member? This action cannot be undone." 
        itemName={staffToDelete?.name} 
      />
    </>
  );
};

export default Staffs;