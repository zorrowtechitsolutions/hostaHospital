// LabTests.jsx
import React, { useState } from 'react';
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
  Package,
  IndianRupee
} from 'lucide-react';
import DeleteModal from '../patients/DeleteModel';
import AddEditLabTestModal from './AddEditLabTestModal';

const LabTests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const itemsPerPage = 10;

  // Lab Tests Data - Simplified
  const [labTests, setLabTests] = useState([
    {
      id: "LT001",
      testId: "BLD001",
      testName: "Blood Sugar (Glucose)",
      type: "Test",
      price: 120,
      category: "Biochemistry",
      sampleType: "Blood",
      preparation: "Fasting required for 8-10 hours",
      turnaroundTime: "2-4 hours",
      status: "Active"
    },
    {
      id: "LT002",
      testId: "BLD002",
      testName: "Hemoglobin (Hb)",
      type: "Test",
      price: 120,
      category: "Hematology",
      sampleType: "Blood",
      preparation: "No special preparation required",
      turnaroundTime: "1-2 hours",
      status: "Active"
    },
    {
      id: "LT003",
      testId: "BLD003",
      testName: "Cholesterol",
      type: "Test",
      price: 220,
      category: "Biochemistry",
      sampleType: "Blood",
      preparation: "Fasting required for 10-12 hours",
      turnaroundTime: "4-6 hours",
      status: "Active"
    },
    {
      id: "LT004",
      testId: "PNL001",
      testName: "CBC (Complete Blood Count)",
      type: "Group",
      price: 350,
      category: "Hematology",
      sampleType: "Blood",
      preparation: "No special preparation required",
      turnaroundTime: "4-6 hours",
      status: "Active"
    },
    {
      id: "LT005",
      testId: "PNL002",
      testName: "KFT (Kidney Function Test)",
      type: "Group",
      price: 600,
      category: "Biochemistry",
      sampleType: "Blood/Urine",
      preparation: "Fasting required for 8-10 hours",
      turnaroundTime: "6-8 hours",
      status: "Active"
    },
    {
      id: "LT006",
      testId: "PNL003",
      testName: "LFT (Liver Function Test)",
      type: "Group",
      price: 600,
      category: "Biochemistry",
      sampleType: "Blood",
      preparation: "Fasting required for 8-10 hours",
      turnaroundTime: "6-8 hours",
      status: "Active"
    },
    {
      id: "LT007",
      testId: "PNL004",
      testName: "Electrolyte Panel",
      type: "Group",
      price: 500,
      category: "Biochemistry",
      sampleType: "Blood/Urine",
      preparation: "No special preparation required",
      turnaroundTime: "4-6 hours",
      status: "Active"
    },
    {
      id: "LT008",
      testId: "PNL005",
      testName: "Full Body Checkup",
      type: "Group",
      price: 3000,
      category: "Wellness",
      sampleType: "Blood/Urine",
      preparation: "Fasting required for 10-12 hours",
      turnaroundTime: "24-48 hours",
      status: "Active"
    },
    {
      id: "LT009",
      testId: "BLD004",
      testName: "Thyroid Profile (T3, T4, TSH)",
      type: "Group",
      price: 600,
      category: "Endocrinology",
      sampleType: "Blood",
      preparation: "No special preparation required",
      turnaroundTime: "6-8 hours",
      status: "Active"
    },
    {
      id: "LT010",
      testId: "BLD005",
      testName: "Vitamin B12",
      type: "Test",
      price: 800,
      category: "Nutrition",
      sampleType: "Blood",
      preparation: "Fasting required for 8 hours",
      turnaroundTime: "24 hours",
      status: "Active"
    },
    {
      id: "LT011",
      testId: "BLD006",
      testName: "Vitamin D (25-Hydroxy)",
      type: "Test",
      price: 1100,
      category: "Nutrition",
      sampleType: "Blood",
      preparation: "No special preparation required",
      turnaroundTime: "24-48 hours",
      status: "Active"
    },
    {
      id: "LT012",
      testId: "PNL006",
      testName: "Lipid Profile",
      type: "Group",
      price: 600,
      category: "Biochemistry",
      sampleType: "Blood",
      preparation: "Fasting required for 10-12 hours",
      turnaroundTime: "4-6 hours",
      status: "Active"
    }
  ]);

  const getTypeBadge = (type) => {
    return type === "Test" 
      ? "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
      : "bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs";
  };

  const handleViewTest = (test) => {
    alert(`Viewing details for ${test.testName}`);
    setOpenMenu(null);
  };

  const handleEditTest = (test) => {
    setSelectedTest(test);
    setShowAddEditModal(true);
    setOpenMenu(null);
  };

  const handleDeleteClick = (test) => {
    setItemToDelete(test);
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setLabTests(labTests.filter(t => t.id !== itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleAddNewTest = () => {
    setSelectedTest(null);
    setShowAddEditModal(true);
  };

  const handleSaveTest = (testData) => {
    if (selectedTest) {
      // Edit existing test
      setLabTests(labTests.map(t => t.id === selectedTest.id ? { ...testData, id: t.id } : t));
    } else {
      // Add new test
      const newId = `LT${String(labTests.length + 1).padStart(3, '0')}`;
      const newTestId = testData.type === "Test" ? "BLD" : "PNL";
      const newTest = {
        ...testData,
        id: newId,
        testId: `${newTestId}${String(labTests.length + 1).padStart(3, '0')}`
      };
      setLabTests([...labTests, newTest]);
    }
    setShowAddEditModal(false);
    setSelectedTest(null);
  };

  // Filter data
  const getFilteredTests = () => {
    let filtered = [...labTests];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.testId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    return filtered;
  };

  const filteredTests = getFilteredTests();
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = filteredTests.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const filtered = getFilteredTests();
    const exportData = filtered.map(test => ({
      'Test ID': test.testId,
      'Test Name': test.testName,
      'Type': test.type,
      'Price (₹)': test.price,
      'Category': test.category,
      'Sample Type': test.sampleType,
      'Turnaround Time': test.turnaroundTime,
      'Status': test.status
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `lab_tests_${new Date().toISOString().split('T')[0]}.json`;
    
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
        alert(`Successfully imported ${importedData.length} lab tests!`);
        console.log('Imported data:', importedData);
      } catch (error) {
        alert('Error parsing JSON file. Please make sure it\'s a valid JSON file.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllFilters = () => {
    setTypeFilter('');
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (typeFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Lab Tests
          </h1>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>Home</span>
            <ChevronRight size={14} />
            <span>Laboratory</span>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium">Lab Tests</span>
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
                  placeholder="Search by Test ID, Test Name, Category..."
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
                onClick={handleAddNewTest}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1C62A0] text-white hover:bg-[#154a7d] transition-all duration-200"
              >
                <Package size={18} />
                <span className="hidden sm:inline">Add Test</span>
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Test Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full border border-gray-300 text-sm rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="Test">Test</option>
                      <option value="Group">Group</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{filteredTests.length}</span> of{' '}
                    <span className="font-semibold text-gray-900">{labTests.length}</span> lab tests
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lab Tests Table */}
          {filteredTests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lab tests found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
              <div className="overflow-x-auto overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Test ID</th>
                      <th className="px-6 py-3">Test Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Price (₹)</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Sample Type</th>
                      <th className="px-6 py-3">Turnaround</th>
                      <th className="px-6 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTests.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {item.testId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.testName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getTypeBadge(item.type)}>{item.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-700 font-semibold">
                            <IndianRupee size={14} className="text-gray-400" />
                            {item.price}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">{item.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{item.sampleType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{item.turnaroundTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center relative">
                          {/* Three-dot menu button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu === item.id ? null : item.id);
                            }}
                            className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenu === item.id && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTest(item);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                              >
                                <Edit size={15} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(item);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-b-lg"
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredTests.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length} lab tests
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
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Lab Test"
        message="Are you sure you want to delete this lab test?"
        itemName={itemToDelete?.testName}
      />

      {/* Add/Edit Lab Test Modal */}
      <AddEditLabTestModal
        isOpen={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setSelectedTest(null);
        }}
        onSave={handleSaveTest}
        test={selectedTest}
      />
    </>
  );
};

export default LabTests;