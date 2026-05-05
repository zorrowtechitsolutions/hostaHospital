// src/components/Laboratory/LabTests.jsx - CORRECTED
import React, { useState } from 'react';
import { 
  RefreshCcw, Download, Upload,
  Edit, Trash2, FileText, MoreVertical, Plus
} from 'lucide-react';
import { Button, SearchBar } from '../ui';
import DeleteModal from '../patients/DeleteModel';
import AddEditLabTestModal from './AddEditLabTestModal';

const LabTests = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const itemsPerPage = 10;

  const [labTests, setLabTests] = useState([
    { id: "LT001", testId: "BLD001", testName: "Blood Sugar (Glucose)", type: "Test", price: 120, category: "Biochemistry", sampleType: "Blood", preparation: "Fasting required for 8-10 hours", turnaroundTime: "2-4 hours", status: "Active" },
    { id: "LT002", testId: "BLD002", testName: "Hemoglobin (Hb)", type: "Test", price: 120, category: "Hematology", sampleType: "Blood", preparation: "No special preparation required", turnaroundTime: "1-2 hours", status: "Active" },
    { id: "LT003", testId: "BLD003", testName: "Cholesterol", type: "Test", price: 220, category: "Biochemistry", sampleType: "Blood", preparation: "Fasting required for 10-12 hours", turnaroundTime: "4-6 hours", status: "Active" },
    { id: "LT004", testId: "PNL001", testName: "CBC (Complete Blood Count)", type: "Group", price: 350, category: "Hematology", sampleType: "Blood", preparation: "No special preparation required", turnaroundTime: "4-6 hours", status: "Active" },
    { id: "LT005", testId: "PNL002", testName: "KFT (Kidney Function Test)", type: "Group", price: 600, category: "Biochemistry", sampleType: "Blood/Urine", preparation: "Fasting required for 8-10 hours", turnaroundTime: "6-8 hours", status: "Active" },
    { id: "LT006", testId: "PNL003", testName: "LFT (Liver Function Test)", type: "Group", price: 600, category: "Biochemistry", sampleType: "Blood", preparation: "Fasting required for 8-10 hours", turnaroundTime: "6-8 hours", status: "Active" },
    { id: "LT007", testId: "PNL004", testName: "Electrolyte Panel", type: "Group", price: 500, category: "Biochemistry", sampleType: "Blood/Urine", preparation: "No special preparation required", turnaroundTime: "4-6 hours", status: "Active" },
    { id: "LT008", testId: "PNL005", testName: "Full Body Checkup", type: "Group", price: 3000, category: "Wellness", sampleType: "Blood/Urine", preparation: "Fasting required for 10-12 hours", turnaroundTime: "24-48 hours", status: "Active" },
    { id: "LT009", testId: "BLD004", testName: "Thyroid Profile (T3, T4, TSH)", type: "Group", price: 600, category: "Endocrinology", sampleType: "Blood", preparation: "No special preparation required", turnaroundTime: "6-8 hours", status: "Active" },
    { id: "LT010", testId: "BLD005", testName: "Vitamin B12", type: "Test", price: 800, category: "Nutrition", sampleType: "Blood", preparation: "Fasting required for 8 hours", turnaroundTime: "24 hours", status: "Active" },
    { id: "LT011", testId: "BLD006", testName: "Vitamin D (25-Hydroxy)", type: "Test", price: 1100, category: "Nutrition", sampleType: "Blood", preparation: "No special preparation required", turnaroundTime: "24-48 hours", status: "Active" },
    { id: "LT012", testId: "PNL006", testName: "Lipid Profile", type: "Group", price: 600, category: "Biochemistry", sampleType: "Blood", preparation: "Fasting required for 10-12 hours", turnaroundTime: "4-6 hours", status: "Active" }
  ]);

  const getTypeBadge = (type) => type === "Test" ? "info" : "purple";

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
  
  const handleAddNewTest = () => { 
    setSelectedTest(null); 
    setShowAddEditModal(true); 
  };
  
  const handleSaveTest = (testData) => {
    if (selectedTest) {
      setLabTests(labTests.map(t => t.id === selectedTest.id ? { ...testData, id: t.id } : t));
    } else {
      const newId = `LT${String(labTests.length + 1).padStart(3, '0')}`;
      const newTestId = testData.type === "Test" ? "BLD" : "PNL";
      setLabTests([...labTests, { 
        ...testData, 
        id: newId, 
        testId: `${newTestId}${String(labTests.length + 1).padStart(3, '0')}` 
      }]);
    }
    setShowAddEditModal(false);
    setSelectedTest(null);
  };

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

  const handleRefresh = () => { 
    setSearchTerm(""); 
    setTypeFilter(""); 
    setCurrentPage(1); 
  };
  
  const handleExport = () => {
    const exportData = getFilteredTests().map(test => ({ 
      'Test ID': test.testId, 
      'Test Name': test.testName, 
      'Type': test.type, 
      'Price (₹)': test.price, 
      'Category': test.category, 
      'Sample Type': test.sampleType, 
      'Turnaround Time': test.turnaroundTime, 
      'Status': test.status 
    }));
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    link.download = `lab_tests_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        alert(`Successfully imported ${importedData.length} lab tests!`);
      } catch (error) { 
        alert('Error parsing JSON file.'); 
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const clearAllFilters = () => { 
    setTypeFilter(''); 
    setSearchTerm(''); 
  };

  // Row Action Menu Component
  const RowActionMenu = ({ test }) => {
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
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button 
              onClick={() => { 
                handleEditTest(test); 
                setShowMenu(false); 
              }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
            >
              <Edit size={16} /> Edit
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button 
              onClick={() => { 
                handleDeleteClick(test); 
                setShowMenu(false); 
              }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <Trash2 size={16} /> Delete
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
              onClick={() => window.history.back()}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-700">Lab Tests</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Home</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Laboratory</span>
              <span className="mx-1 text-gray-400">»</span>
              <span>Lab Tests</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Lab Tests</h1>
        </div>

        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <SearchBar 
              placeholder="Search by Test ID, Test Name, Category..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
              onClear={() => setSearchTerm('')} 
              className="flex-1 max-w-sm" 
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All Types</option>
              <option value="Test">Test</option>
              <option value="Group">Group</option>
            </select>
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
              title="Import Lab Tests"
            >
              <Upload size={16} />
            </label>

            <button onClick={handleExport} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Export Lab Tests">
              <Download size={16} />
            </button>

            <button
              onClick={handleAddNewTest}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1C62A0] rounded-md flex items-center gap-2"
            >
              <Plus size={16} /> New Test
            </button>
          </div>
        </div>

        {/* Lab Tests Table - List View */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lab tests found</h3>
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
                Total Lab Tests
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                  {filteredTests.length}
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Test ID</th>
                    <th className="px-6 py-3">Test Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Price (₹)</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Sample Type</th>
                    <th className="px-6 py-3">Turnaround</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTests.map((test, index) => (
                    <tr key={test.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">#{test.testId}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{test.testName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${test.type === "Test" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                          {test.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-700 font-semibold">
                          ₹{test.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{test.category}</td>
                      <td className="px-6 py-4 text-gray-600">{test.sampleType}</td>
                      <td className="px-6 py-4 text-gray-600">{test.turnaroundTime}</td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu test={test} />
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
                    onClick={() => {
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
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
                    {currentPage}
                  </span>
                  <button
                    onClick={() => {
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
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
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
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