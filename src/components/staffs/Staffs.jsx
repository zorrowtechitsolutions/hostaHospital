// Staffs.jsx - With Pagination
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Users as UsersIcon,
  RefreshCcw,
  Upload,
  Search,
  Trash2
} from 'lucide-react';
import DeleteModal from '../patients/DeleteModel';

const Staffs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  // Filter states
  const [designationFilter, setDesignationFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Staff data state
  const [staffsData, setStaffsData] = useState([]);

  // Load staffs from localStorage on component mount
  useEffect(() => {
    loadStaffsFromStorage();
  }, []);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, designationFilter, genderFilter]);

  // Default staff data
  const defaultStaffsData = [
    { 
      id: '#SF0025', 
      name: 'Benjamin Clark', 
      firstName: 'Benjamin', 
      lastName: 'Clark', 
      gender: 'Male', 
      designation: 'Compounder', 
      phone: '+1 48902 78194', 
      email: 'benjamin@example.com', 
      appointmentDate: '2025-06-17',
      appointmentDateDisplay: '17 Jun 2025',
      patientsCount: 127, 
      imageUrl: 'https://i.pravatar.cc/80?img=12', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '01 Jan 1995',
      address: '10 Elizabethtown Plaza, Downers Grove, Elizabeth UK07202',
      salary: '$18,600',
      joiningDate: '17 Jun 2024',
      department: 'Pharmacy',
      staffType: 'Permanent'
    },
    { 
      id: '#SF0024', 
      name: 'Charlotte Hayes', 
      firstName: 'Charlotte', 
      lastName: 'Hayes', 
      gender: 'Female', 
      designation: 'Nurse', 
      phone: '+1 48902 78015', 
      email: 'charlotte@example.com', 
      appointmentDate: '2025-06-10',
      appointmentDateDisplay: '10 Jun 2025', 
      patientsCount: 203, 
      imageUrl: 'https://i.pravatar.cc/80?img=5', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '15 Mar 1992',
      address: '245 Healthcare Ave, New York, NY 10001',
      salary: '$22,500',
      joiningDate: '10 Jun 2024',
      department: 'Nursing',
      staffType: 'Permanent'
    },
    { 
      id: '#SF0023', 
      name: 'Anthony Foster', 
      firstName: 'Anthony', 
      lastName: 'Foster', 
      gender: 'Male', 
      designation: 'Purchase Officer', 
      phone: '+1 61397 47103', 
      email: 'anthony@example.com', 
      appointmentDate: '2025-05-22',
      appointmentDateDisplay: '22 May 2025', 
      patientsCount: 45, 
      imageUrl: 'https://i.pravatar.cc/80?img=3', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '22 Aug 1988',
      address: '78 Business Park, Chicago, IL 60607',
      salary: '$21,000',
      joiningDate: '22 May 2024',
      department: 'Procurement',
      staffType: 'Contract'
    },
    { 
      id: '#SF0022', 
      name: 'Isabella Morgan', 
      firstName: 'Isabella', 
      lastName: 'Morgan', 
      gender: 'Female', 
      designation: 'Supervisor', 
      phone: '+1 84910 67381', 
      email: 'isabella@example.com', 
      appointmentDate: '2025-05-15',
      appointmentDateDisplay: '15 May 2025', 
      patientsCount: 98, 
      imageUrl: 'https://i.pravatar.cc/80?img=10', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '03 Nov 1985',
      address: '156 Management Blvd, Los Angeles, CA 90015',
      salary: '$25,000',
      joiningDate: '15 May 2024',
      department: 'Administration',
      staffType: 'Permanent'
    },
    { 
      id: '#SF0021', 
      name: 'William Turner', 
      firstName: 'William', 
      lastName: 'Turner', 
      gender: 'Male', 
      designation: 'Nurse', 
      phone: '+1 19047 89036', 
      email: 'william@example.com', 
      appointmentDate: '2025-04-30',
      appointmentDateDisplay: '30 Apr 2025', 
      patientsCount: 176, 
      imageUrl: 'https://i.pravatar.cc/80?img=15', 
      status: 'On Leave',
      jobType: 'Part Time',
      dob: '12 Jul 1990',
      address: '89 Medical Center Rd, Boston, MA 02115',
      salary: '$14,200',
      joiningDate: '30 Apr 2024',
      department: 'Nursing',
      staffType: 'Temporary'
    },
    { 
      id: '#SF0020', 
      name: 'Amanda Richardson', 
      firstName: 'Amanda', 
      lastName: 'Richardson', 
      gender: 'Female', 
      designation: 'Receptionist', 
      phone: '+1 71289 45017', 
      email: 'amanda@example.com', 
      appointmentDate: '2025-04-25',
      appointmentDateDisplay: '25 Apr 2025', 
      patientsCount: 312, 
      imageUrl: 'https://i.pravatar.cc/80?img=9', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '28 Feb 1998',
      address: '34 Front Desk Lane, Houston, TX 77002',
      salary: '$16,500',
      joiningDate: '25 Apr 2024',
      department: 'Front Office',
      staffType: 'Permanent'
    },
    { 
      id: '#SF0019', 
      name: 'Nathaniel Lewis', 
      firstName: 'Nathaniel', 
      lastName: 'Lewis', 
      gender: 'Male', 
      designation: 'Lab Assistant', 
      phone: '+1 57109 25913', 
      email: 'nathaniel@example.com', 
      appointmentDate: '2025-03-13',
      appointmentDateDisplay: '13 Mar 2025', 
      patientsCount: 84, 
      imageUrl: 'https://i.pravatar.cc/80?img=7', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '05 May 1993',
      address: '67 Lab Sciences Dr, Seattle, WA 98101',
      salary: '$15,800',
      joiningDate: '13 Mar 2024',
      department: 'Laboratory',
      staffType: 'Permanent'
    },
    { 
      id: '#SF0018', 
      name: 'Katherine Stewart', 
      firstName: 'Katherine', 
      lastName: 'Stewart', 
      gender: 'Female', 
      designation: 'Pharmacist', 
      phone: '+1 56193 61902', 
      email: 'katherine@example.com', 
      appointmentDate: '2025-02-16',
      appointmentDateDisplay: '16 Feb 2025', 
      patientsCount: 219, 
      imageUrl: 'https://i.pravatar.cc/80?img=20', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '19 Sep 1987',
      address: '123 Pharmacy Ave, Denver, CO 80202',
      salary: '$24,000',
      joiningDate: '16 Feb 2024',
      department: 'Pharmacy',
      staffType: 'Permanent'
    }
  ];

  const loadStaffsFromStorage = () => {
    const storedStaffs = localStorage.getItem('staffs');
    if (storedStaffs) {
      setStaffsData(JSON.parse(storedStaffs));
    } else {
      setStaffsData(defaultStaffsData);
      localStorage.setItem('staffs', JSON.stringify(defaultStaffsData));
    }
  };

  const getAllDesignations = () => {
    const designations = [...new Set(staffsData.map(s => s.designation).filter(Boolean))];
    return designations.sort();
  };

  const getFilteredStaffs = () => {
    let filtered = [...staffsData];
    
    if (searchTerm) {
      filtered = filtered.filter(staff => 
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.includes(searchTerm) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (designationFilter !== 'all') {
      filtered = filtered.filter(staff => staff.designation === designationFilter);
    }
    
    if (genderFilter !== 'all') {
      filtered = filtered.filter(staff => staff.gender === genderFilter);
    }
    
    return filtered;
  };

  const filteredStaffs = getFilteredStaffs();
  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaffs = filteredStaffs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setDesignationFilter("all");
    setGenderFilter("all");
    setCurrentPage(1);
    loadStaffsFromStorage();
  };

  const handleExport = () => {
    const filteredStaffs = getFilteredStaffs();
    const exportData = filteredStaffs.map(staff => ({
      'Staff ID': staff.id,
      'Staff Name': staff.name,
      'Gender': staff.gender,
      'Designation': staff.designation,
      'Phone Number': staff.phone,
      'Email': staff.email,
      'Appointment Date': staff.appointmentDateDisplay,
      'Department': staff.department
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `staffs_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const existingStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
        const updatedStaffs = [...existingStaffs, ...importedData];
        const uniqueStaffs = updatedStaffs.filter((staff, index, self) => 
          index === self.findIndex(s => s.id === staff.id)
        );
        localStorage.setItem('staffs', JSON.stringify(uniqueStaffs));
        setStaffsData(uniqueStaffs);
        alert(`Successfully imported ${importedData.length} staff members!`);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setActiveTab('basic');
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

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      const existingStaffs = JSON.parse(localStorage.getItem('staffs') || '[]');
      const updatedStaffs = existingStaffs.filter(s => s.id !== staffToDelete.id);
      localStorage.setItem('staffs', JSON.stringify(updatedStaffs));
      setStaffsData(updatedStaffs);
      setShowDeleteModal(false);
      setStaffToDelete(null);
    }
  };

  const handleAddStaff = () => {
    navigate('/add-staff');
  };

  const clearAllFilters = () => {
    setDesignationFilter('all');
    setGenderFilter('all');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (designationFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  // Staff Details Modal Component
  const StaffDetailsModal = ({ staff, onClose }) => {
    if (!staff) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
        <div className="bg-white w-[600px] rounded-xl shadow-xl">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Staff Details</h2>
            <button 
              onClick={onClose} 
              className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={staff.imageUrl || 'https://i.pravatar.cc/80'} 
                alt={staff.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{staff.name}</h3>
                <p className="text-sm text-gray-500">{staff.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Designation</label>
                <p className="text-sm text-gray-800">{staff.designation}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Department</label>
                <p className="text-sm text-gray-800">{staff.department || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Gender</label>
                <p className="text-sm text-gray-800">{staff.gender}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Phone</label>
                <p className="text-sm text-gray-800">{staff.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-800">{staff.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Appointment Date</label>
                <p className="text-sm text-gray-800">{staff.appointmentDateDisplay}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Salary</label>
                <p className="text-sm text-gray-800">{staff.salary}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Status</label>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{staff.status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleEditStaff(staff);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-[#154a7d]"
            >
              Edit Staff
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Row Action Menu Component
  const RowActionMenu = ({ staff }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setShowMenu(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
        >
          <MoreVertical size={18} />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                handleViewDetails(staff);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={16} />
              View Details
            </button>
            <button
              onClick={() => {
                handleEditStaff(staff);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit size={16} />
              Edit
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => {
                handleDeleteClick(staff);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Staffs</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Staffs</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Staffs</h1>
        </div>

        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, staff ID, designation or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
              <button className="absolute right-2 top-1.5 bg-[#1C62A0] p-1 rounded">
                <Search size={14} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh">
              <RefreshCcw size={16} />
            </button>

            <input
              type="file"
              onChange={handleImport}
              accept=".json"
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
              title="Import Staffs"
            >
              <Upload size={16} />
            </label>

            <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Staffs">
              <Download size={16} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-2 border border-gray-200 rounded-md bg-white ${
                showFilters || activeFilterCount > 0 ? 'text-blue-600' : 'text-gray-500'
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

            <button
              onClick={handleAddStaff}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2"
            >
              <Plus size={16} /> New Staff
            </button>
          </div>
        </div>

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-700 font-medium">
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                <select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Designations</option>
                  {getAllDesignations().map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Staff Table with Pagination */}
        {filteredStaffs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-md hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">
                Total Staffs
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {filteredStaffs.length}
                </span>
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
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">{staff.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={staff.imageUrl || 'https://i.pravatar.cc/80'} 
                            alt={staff.name} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-800">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{staff.gender}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.designation}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.appointmentDateDisplay}</td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu staff={staff} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredStaffs.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredStaffs.length)} of {filteredStaffs.length} staff members
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded-md text-sm transition-all ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-1 border rounded-md text-sm transition-all ${
                      currentPage === totalPages || totalPages === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Details Modal */}
      {showDetailsModal && selectedStaff && (
        <StaffDetailsModal staff={selectedStaff} onClose={() => setShowDetailsModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        itemName={staffToDelete?.name}
      />
    </>
  );
};

export default Staffs;