// AllLabResults.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  Download, 
  Upload,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  FileText,
  MoreVertical,
  Plus
} from 'lucide-react';
import LaboratoryReportModal from '../patients/modals/LaboratoryReportModal';
import DeleteModal from '../patients/DeleteModel';

const AllLabResults = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const itemsPerPage = 10;

  // Load data from localStorage or use sample data
  const [labResults, setLabResults] = useState(() => {
    const stored = localStorage.getItem('labResults');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        id: "LAB-001",
        testId: "LDH001",
        patientName: "James Carter",
        gender: "Male",
        appointmentDate: "2025-01-25",
        referredBy: "Dr. Sandy Maria",
        testName: "Complete Blood Count (CBC)",
        status: "Completed",
        patientId: "PT0025",
        age: 45,
        testType: "Hematology",
        amount: 2500,
        paymentStatus: "Paid",
        department: "Pathology",
        labTechnician: "Dr. Emily Watson",
        resultSummary: "Elevated WBC count detected",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        mobile: "+1 555 123-4567",
        email: "james.carter@email.com",
        address: "California, USA",
        resultValue: "75",
        referenceRange: "50-62",
        unit: "%",
        interpretation: "Elevated",
        discount: 0,
        paid: 2500,
        balance: 0,
        investigations: [
          { name: "Neutrophils", result: 75, refLow: 50, refHigh: 62, unit: "%" },
          { name: "Lymphocytes", result: 90, refLow: 20, refHigh: 40, unit: "%" },
        ]
      },
      {
        id: "LAB-002",
        testId: "LDH002",
        patientName: "Sarah Johnson",
        gender: "Female",
        appointmentDate: "2025-01-26",
        referredBy: "Dr. Robert Chen",
        testName: "Lipid Profile",
        status: "Completed",
        patientId: "PT0089",
        age: 45,
        testType: "Biochemistry",
        amount: 1800,
        paymentStatus: "Paid",
        department: "Biochemistry",
        labTechnician: "Dr. Michael Roberts",
        resultSummary: "Cholesterol levels elevated",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        mobile: "+1 555 234-5678",
        email: "sarah.j@email.com",
        address: "New York, USA",
        resultValue: "220",
        referenceRange: "125-200",
        unit: "mg/dL",
        interpretation: "Elevated",
        discount: 0,
        paid: 1800,
        balance: 0,
        investigations: []
      },
      {
        id: "LAB-003",
        testId: "LDH003",
        patientName: "Michael Brown",
        gender: "Male",
        appointmentDate: "2025-01-24",
        referredBy: "Dr. Emily Watson",
        testName: "Thyroid Profile",
        status: "Pending",
        patientId: "PT0045",
        age: 28,
        testType: "Endocrinology",
        amount: 2200,
        paymentStatus: "Pending",
        department: "Endocrinology",
        labTechnician: "Not Assigned",
        resultSummary: "Awaiting results",
        avatar: "https://randomuser.me/api/portraits/men/45.jpg",
        mobile: "+1 555 345-6789",
        email: "michael.b@email.com",
        address: "Texas, USA",
        resultValue: "",
        referenceRange: "",
        unit: "",
        interpretation: "",
        discount: 50,
        paid: 200,
        balance: 1950,
        investigations: []
      }
    ];
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      Completed: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs",
      Pending: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs",
      "In Progress": "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs",
      Cancelled: "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs",
    };
    return styles[status] || styles.Pending;
  };

  const handleViewReport = (labResult) => {
    setSelectedLabResult(labResult);
    setShowLabModal(true);
    setOpenMenu(null);
  };

  const handleAddNewResult = () => {
    navigate('/lab/results/add');
  };

  const handleEditResult = (result) => {
    navigate(`/lab/results/edit/${result.id}`);
    setOpenMenu(null);
  };

  const handleDeleteClick = (result) => {
    setItemToDelete(result);
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      const updatedResults = labResults.filter(r => r.id !== itemToDelete.id);
      setLabResults(updatedResults);
      localStorage.setItem('labResults', JSON.stringify(updatedResults));
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const getAllStatuses = () => {
    const statuses = [...new Set(labResults.map(r => r.status))];
    return statuses.sort();
  };

  const getFilteredResults = () => {
    let filtered = [...labResults];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.testId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referredBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(item => item.appointmentDate === dateFilter);
    }
    
    return filtered;
  };

  const filteredResults = getFilteredResults();
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const filtered = getFilteredResults();
    const exportData = filtered.map(result => ({
      'Test ID': result.testId,
      'Patient Name': result.patientName,
      'Gender': result.gender,
      'Appointment Date': formatDate(result.appointmentDate),
      'Referred By': result.referredBy,
      'Test Name': result.testName,
      'Status': result.status,
      'Amount': result.amount,
      'Payment Status': result.paymentStatus
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `lab_results_${new Date().toISOString().split('T')[0]}.json`;
    
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
        const existingResults = JSON.parse(localStorage.getItem('labResults') || '[]');
        const updatedResults = [...existingResults, ...importedData];
        localStorage.setItem('labResults', JSON.stringify(updatedResults));
        setLabResults(updatedResults);
        alert(`Successfully imported ${importedData.length} lab results!`);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter) count++;
    if (dateFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Row Action Menu Component
  const RowActionMenu = ({ result }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="relative">
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
                handleViewReport(result);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Eye size={16} />
              View Report
            </button>
            <button
              onClick={() => {
                handleEditResult(result);
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
                handleDeleteClick(result);
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
              <span className="text-gray-700">Lab Results</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Laboratory</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Lab Results</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Lab Results</h1>
        </div>

        {/* Search Bar and Action Buttons - Status filter removed from here */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Test ID, Patient Name, Test Name..."
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
              title="Import Lab Results"
            >
              <Upload size={16} />
            </label>

            <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Lab Results">
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
              onClick={handleAddNewResult}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2"
            >
              <Plus size={16} /> New Lab Result
            </button>
          </div>
        </div>

        {/* Collapsible Filter Section - Status and Date filters inside */}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {getAllStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lab Results Table - List View */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results found</h3>
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
                Total Lab Results
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {filteredResults.length}
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Test ID</th>
                    <th className="px-6 py-3">Patient Name</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Appointment Date</th>
                    <th className="px-6 py-3">Referred By</th>
                    <th className="px-6 py-3">Test Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">{item.testId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.avatar} 
                            alt={item.patientName} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://randomuser.me/api/portraits/${item.gender === 'Male' ? 'men' : 'women'}/1.jpg`;
                            }}
                          />
                          <span className="font-medium text-gray-800">{item.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {item.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(item.appointmentDate)}</td>
                      <td className="px-6 py-4 text-gray-600">{item.referredBy}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-gray-800">{item.testName}</div>
                          <div className="text-xs text-gray-500">{item.testType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(item.status)}>{item.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu result={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredResults.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} lab results
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

      {/* Laboratory Report Modal */}
      <LaboratoryReportModal
        isOpen={showLabModal}
        onClose={() => {
          setShowLabModal(false);
          setSelectedLabResult(null);
        }}
        labResult={selectedLabResult}
        patient={selectedLabResult ? {
          name: selectedLabResult.patientName,
          id: selectedLabResult.patientId,
          age: selectedLabResult.age,
          gender: selectedLabResult.gender
        } : null}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Lab Result"
        message="Are you sure you want to delete this lab result?"
        itemName={itemToDelete ? `${itemToDelete.testName} for ${itemToDelete.patientName}` : ""}
      />
    </>
  );
};

export default AllLabResults;