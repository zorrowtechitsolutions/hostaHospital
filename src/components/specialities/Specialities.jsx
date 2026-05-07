// src/components/Specialities/Specialities.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Brain, Bone, Eye, Stethoscope, 
  Activity, Microscope, Shield, Users, 
  Search, Filter, RefreshCcw, Plus
} from 'lucide-react';
import { 
  Button, Card, SearchBar, Pagination, Loader 
} from '../ui';

const Specialities = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 8;

  // Specialities data with IDs and icons - MATCHING DOCTORS SPECIALTIES
  const specialitiesData = [
    { id: 1, name: 'Periodontist', icon: Heart, color: '#e74c3c', bgColor: '#fdecea', description: 'Heart and cardiovascular system', doctorsCount: 2 },
    { id: 2, name: 'Dermatopathologist', icon: Brain, color: '#3498db', bgColor: '#e8f4fd', description: 'Brain and nervous system', doctorsCount: 1 },
    { id: 3, name: 'Orthopedics', icon: Bone, color: '#2ecc71', bgColor: '#e8f8f0', description: 'Bones and joints', doctorsCount: 1 },
    { id: 4, name: 'Ophthalmology', icon: Eye, color: '#9b59b6', bgColor: '#f4e8f7', description: 'Eye care and vision', doctorsCount: 1 },
    { id: 5, name: 'Pediatrics', icon: Stethoscope, color: '#1abc9c', bgColor: '#e8faf5', description: 'Child healthcare', doctorsCount: 1 },
    { id: 6, name: 'Dermatology', icon: Shield, color: '#f39c12', bgColor: '#fef5e8', description: 'Skin care', doctorsCount: 1 },
    { id: 7, name: 'Radiology', icon: Microscope, color: '#16a085', bgColor: '#e8f6f3', description: 'Medical imaging', doctorsCount: 1 },
    { id: 8, name: 'General Medicine', icon: Activity, color: '#7f8c8d', bgColor: '#f0f0f0', description: 'General healthcare', doctorsCount: 1 },
    { id: 9, name: 'ENT', icon: Users, color: '#e67e22', bgColor: '#fef0e6', description: 'Ear, Nose, Throat', doctorsCount: 1 },
    { id: 10, name: 'Psychiatry', icon: Brain, color: '#8e44ad', bgColor: '#f3e8f7', description: 'Mental health', doctorsCount: 1 },
    { id: 11, name: 'Urology', icon: Stethoscope, color: '#2980b9', bgColor: '#e8f2f9', description: 'Urinary tract', doctorsCount: 1 },
    { id: 12, name: 'Gastroenterology', icon: Activity, color: '#27ae60', bgColor: '#e8f8f0', description: 'Digestive system', doctorsCount: 1 }
  ];

  const getFilteredSpecialities = () => {
    let filtered = [...specialitiesData];
    if (searchTerm) {
      filtered = filtered.filter(spec => 
        spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredSpecialities = getFilteredSpecialities();
  const totalPages = Math.ceil(filteredSpecialities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSpecialities = filteredSpecialities.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSpecialityClick = (speciality) => {
    // Navigate to doctors list filtered by speciality
    navigate('/doctors', { state: { speciality: speciality.name } });
  };

  if (loading) return <Loader centered />;

  return (
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
            <span className="text-gray-700">Specialities</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Specialities</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Medical Specialities</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and explore medical departments</p>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <SearchBar 
            placeholder="Search by speciality name or description..." 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onClear={() => setSearchTerm('')} 
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={handleRefresh} className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50" title="Refresh">
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* Specialities Grid */}
      {filteredSpecialities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No specialities found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedSpecialities.map((speciality) => {
              const Icon = speciality.icon;
              return (
                <div
                  key={speciality.id}
                  onClick={() => handleSpecialityClick(speciality)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  <div className="p-5">
                    {/* Icon Section */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: speciality.bgColor }}
                    >
                      <Icon size={28} style={{ color: speciality.color }} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {speciality.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {speciality.description}
                    </p>
                    
                    {/* Doctors Count */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                          <Users size={12} className="text-blue-500" />
                        </div>
                        <span className="text-xs text-gray-600">
                          {speciality.doctorsCount} {speciality.doctorsCount === 1 ? 'Doctor' : 'Doctors'}
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 group-hover:translate-x-1 transition-transform">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredSpecialities.length)} of {filteredSpecialities.length} specialities
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
                <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
                  {currentPage}
                </span>
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
          )}
        </>
      )}
    </div>
  );
};

export default Specialities;