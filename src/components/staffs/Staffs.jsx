// Staffs.jsx - With DeleteModal integration
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

  // Staff data state
  const [staffsData, setStaffsData] = useState([]);

  // Load staffs from localStorage on component mount
  useEffect(() => {
    loadStaffsFromStorage();
  }, []);

  // Default staff data with salary transactions
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
      staffType: 'Permanent',
      salaryTransactions: [
        { id: '#TN578193', amount: '$18,600', creditOn: '16 Feb 2025', salaryFor: 'Jan 2025' },
        { id: '#TN578192', amount: '$18,600', creditOn: '18 Jan 2025', salaryFor: 'Dec 2024' },
        { id: '#TN578190', amount: '$18,600', creditOn: '15 Dec 2024', salaryFor: 'Nov 2024' },
        { id: '#TN578189', amount: '$18,600', creditOn: '17 Nov 2024', salaryFor: 'Oct 2024' },
        { id: '#TN578188', amount: '$18,600', creditOn: '15 Oct 2024', salaryFor: 'Sep 2024' },
        { id: '#TN578187', amount: '$18,600', creditOn: '18 Sep 2024', salaryFor: 'Aug 2024' },
        { id: '#TN578186', amount: '$18,600', creditOn: '15 Aug 2024', salaryFor: 'Jul 2024' }
      ]
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
      staffType: 'Permanent',
      salaryTransactions: [
        { id: '#TN578193', amount: '$22,500', creditOn: '16 Feb 2025', salaryFor: 'Jan 2025' },
        { id: '#TN578192', amount: '$22,500', creditOn: '18 Jan 2025', salaryFor: 'Dec 2024' }
      ]
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
      staffType: 'Contract',
      salaryTransactions: [
        { id: '#TN578193', amount: '$21,000', creditOn: '16 Feb 2025', salaryFor: 'Jan 2025' }
      ]
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
      staffType: 'Permanent',
      salaryTransactions: [
        { id: '#TN578193', amount: '$25,000', creditOn: '16 Feb 2025', salaryFor: 'Jan 2025' }
      ]
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
      staffType: 'Temporary',
      salaryTransactions: []
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
      staffType: 'Permanent',
      salaryTransactions: []
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
      staffType: 'Permanent',
      salaryTransactions: []
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
      staffType: 'Permanent',
      salaryTransactions: []
    },
    { 
      id: '#SF0017', 
      name: 'Eric Patterson', 
      firstName: 'Eric', 
      lastName: 'Patterson', 
      gender: 'Male', 
      designation: 'Nurse', 
      phone: '+1 89105 78103', 
      email: 'eric@example.com', 
      appointmentDate: '2025-01-20',
      appointmentDateDisplay: '20 Jan 2025', 
      patientsCount: 150, 
      imageUrl: 'https://i.pravatar.cc/80?img=8', 
      status: 'Active',
      jobType: 'Full Time',
      dob: '30 Nov 1991',
      address: '56 Healthcare Dr, Miami, FL 33101',
      salary: '$18,200',
      joiningDate: '20 Jan 2024',
      department: 'Nursing',
      staffType: 'Permanent',
      salaryTransactions: []
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

  const handleRefresh = () => {
    setSearchTerm("");
    setDesignationFilter("all");
    setGenderFilter("all");
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
      'Job Type': staff.jobType,
      'Department': staff.department,
      'Salary': staff.salary
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

  // Updated delete handler to use modal
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
      
      // Close modal and clear selection
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

    const salaryTransactions = staff.salaryTransactions && staff.salaryTransactions.length > 0 
      ? staff.salaryTransactions 
      : [
          { id: '#TN578193', amount: staff.salary || '$18,600', creditOn: '16 Feb 2025', salaryFor: 'Jan 2025' },
          { id: '#TN578192', amount: staff.salary || '$18,600', creditOn: '18 Jan 2025', salaryFor: 'Dec 2024' },
          { id: '#TN578190', amount: staff.salary || '$18,600', creditOn: '15 Dec 2024', salaryFor: 'Nov 2024' },
          { id: '#TN578189', amount: staff.salary || '$18,600', creditOn: '17 Nov 2024', salaryFor: 'Oct 2024' },
          { id: '#TN578188', amount: staff.salary || '$18,600', creditOn: '15 Oct 2024', salaryFor: 'Sep 2024' },
          { id: '#TN578187', amount: staff.salary || '$18,600', creditOn: '18 Sep 2024', salaryFor: 'Aug 2024' },
          { id: '#TN578186', amount: staff.salary || '$18,600', creditOn: '15 Aug 2024', salaryFor: 'Jul 2024' }
        ];

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <div style={{
          width: '800px',
          maxWidth: '90vw',
          background: '#fff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}>
          {/* Header */}
          <div style={{
            padding: '15px 20px',
            background: '#f8f9fb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Staff Details</h3>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                background: '#0f172a',
                color: '#fff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                cursor: 'pointer',
                border: 'none',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>

          {/* Profile */}
          <div style={{
            display: 'flex',
            padding: '20px'
          }}>
            <img 
              src={staff.imageUrl || 'https://i.pravatar.cc/80'} 
              alt={staff.name}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '8px',
                marginRight: '15px',
                objectFit: 'cover'
              }}
            />
            <div>
              <span style={{
                background: '#f3e8ff',
                color: '#a855f7',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                {staff.id}
              </span>
              <h4 style={{ margin: '6px 0 2px', fontSize: '18px' }}>{staff.name}</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Date Joined : {staff.joiningDate || staff.appointmentDateDisplay}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            padding: '0 20px 15px'
          }}>
            <button
              onClick={() => setActiveTab('basic')}
              style={{
                border: 'none',
                background: activeTab === 'basic' ? '#3b82f6' : '#eef2f7',
                padding: '6px 12px',
                borderRadius: '6px',
                marginRight: '8px',
                cursor: 'pointer',
                color: activeTab === 'basic' ? '#fff' : '#333',
                transition: 'all 0.2s'
              }}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              style={{
                border: 'none',
                background: activeTab === 'salary' ? '#3b82f6' : '#eef2f7',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: activeTab === 'salary' ? '#fff' : '#333',
                transition: 'all 0.2s'
              }}
            >
              Salary Info
            </button>
          </div>

          {/* Basic Info Tab Content */}
          {activeTab === 'basic' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '18px',
              padding: '0 20px 20px'
            }}>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Job Type</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.jobType || 'Full Time'}</p>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Mobile</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.phone}</p>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Email</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.email}</p>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Gender</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.gender}</p>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>DOB</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.dob || 'N/A'}</p>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Staff Type</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>{staff.staffType || 'Permanent'}</p>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ fontSize: '13px', color: '#6b7280', display: 'block' }}>Address</label>
                <p style={{ fontWeight: 500, marginTop: '3px' }}>
                  {staff.address || '10 Elizabethtown Plaza, Downers Grove, Elizabeth UK07202'}
                </p>
              </div>
            </div>
          )}

          {/* Salary Info Tab Content */}
          {activeTab === 'salary' && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Transaction ID</th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Amount</th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb'
                      }}>Credit On</th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 16px', 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151'
                      }}>Salary For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryTransactions.map((transaction, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: idx !== salaryTransactions.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          borderRight: '1px solid #e5e7eb',
                          color: '#1f2937'
                        }}>{transaction.id}</td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          borderRight: '1px solid #e5e7eb',
                          color: '#1f2937',
                          fontWeight: 500
                        }}>{transaction.amount}</td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          borderRight: '1px solid #e5e7eb',
                          color: '#6b7280'
                        }}>{transaction.creditOn}</td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>{transaction.salaryFor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

  const filteredStaffs = getFilteredStaffs();
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: '#f4f6f9', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Staffs
        </h1>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">Staffs</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, staff ID, designation or phone..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                showFilters || activeFilterCount > 0
                  ? "bg-blue-600 text-white shadow-md"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
              title="Toggle Filters"
            >
              <Filter size={18} />
              {activeFilterCount > 0 && !showFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>

            <label className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
              <Upload size={18} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleAddStaff}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-all duration-200 shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Staff</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>
        )}

        {/* Staff Table View */}
        {filteredStaffs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-lg hover:bg-[#154a7d] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Staff ID</th>
                    <th className="px-6 py-3">Staff Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Phone Number</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Appointment Date</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStaffs.map((staff, index) => (
                    <tr key={staff.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700">{staff.id}</td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img 
                          src={staff.imageUrl || 'https://i.pravatar.cc/80'} 
                          alt={staff.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium text-gray-900">{staff.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{staff.gender}</td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {staff.designation}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-gray-600">{staff.phone}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{staff.email}</td>
                      <td className="px-6 py-4 text-gray-600">{staff.appointmentDateDisplay}</td>
                      <td className="px-6 py-4 text-center">
                        <RowActionMenu staff={staff} />
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 text-xs text-gray-500">
              Showing {filteredStaffs.length} of {staffsData.length} staff members
            </div>
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
    </div>
  );
};

export default Staffs;