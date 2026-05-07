// src/components/Specialities/Specialities.jsx - With working Edit and Delete actions
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Brain, Bone, Eye, Stethoscope, 
  Activity, Microscope, Shield, Users, 
  Search, RefreshCcw, Plus, Edit2, Trash2, X
} from 'lucide-react';
import { 
  Button, Card, SearchBar, Pagination, Loader, Modal, Input, Textarea, Select
} from '../ui';
import { showAddToast, showUpdateToast, showDeleteToast, showWarningToast, showSuccessToast } from '../ui/Toast';

const Specialities = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const itemsPerPage = 8;

  // Specialities data with IDs and icons
  const [specialitiesData, setSpecialitiesData] = useState([
    { id: 1, name: 'Cardiology', icon: 'Heart', color: '#e74c3c', bgColor: '#fdecea', description: 'Heart and cardiovascular system', doctorsCount: 2 },
    { id: 2, name: 'Neurology', icon: 'Brain', color: '#3498db', bgColor: '#e8f4fd', description: 'Brain and nervous system', doctorsCount: 1 },
    { id: 3, name: 'Orthopedics', icon: 'Bone', color: '#2ecc71', bgColor: '#e8f8f0', description: 'Bones and joints', doctorsCount: 1 },
    { id: 4, name: 'Ophthalmology', icon: 'Eye', color: '#9b59b6', bgColor: '#f4e8f7', description: 'Eye care and vision', doctorsCount: 1 },
    { id: 5, name: 'Pediatrics', icon: 'Stethoscope', color: '#1abc9c', bgColor: '#e8faf5', description: 'Child healthcare', doctorsCount: 1 },
    { id: 6, name: 'Dermatology', icon: 'Shield', color: '#f39c12', bgColor: '#fef5e8', description: 'Skin care', doctorsCount: 1 },
    { id: 7, name: 'Radiology', icon: 'Microscope', color: '#16a085', bgColor: '#e8f6f3', description: 'Medical imaging', doctorsCount: 1 },
    { id: 8, name: 'General Medicine', icon: 'Activity', color: '#7f8c8d', bgColor: '#f0f0f0', description: 'General healthcare', doctorsCount: 1 },
    { id: 9, name: 'ENT', icon: 'Users', color: '#e67e22', bgColor: '#fef0e6', description: 'Ear, Nose, Throat', doctorsCount: 1 },
    { id: 10, name: 'Psychiatry', icon: 'Brain', color: '#8e44ad', bgColor: '#f3e8f7', description: 'Mental health', doctorsCount: 1 },
    { id: 11, name: 'Urology', icon: 'Stethoscope', color: '#2980b9', bgColor: '#e8f2f9', description: 'Urinary tract', doctorsCount: 1 },
    { id: 12, name: 'Gastroenterology', icon: 'Activity', color: '#27ae60', bgColor: '#e8f8f0', description: 'Digestive system', doctorsCount: 1 }
  ]);

  // Map icon names to components
  const iconComponents = {
    Heart: Heart,
    Brain: Brain,
    Bone: Bone,
    Eye: Eye,
    Stethoscope: Stethoscope,
    Activity: Activity,
    Microscope: Microscope,
    Shield: Shield,
    Users: Users
  };

  const [newSpeciality, setNewSpeciality] = useState({
    name: '',
    description: '',
    icon: 'Heart',
    color: '#e74c3c',
    bgColor: '#fdecea'
  });

  const [editSpeciality, setEditSpeciality] = useState({
    id: null,
    name: '',
    description: '',
    icon: 'Heart',
    color: '#e74c3c',
    bgColor: '#fdecea'
  });

  const iconOptions = [
    { value: 'Heart', label: 'Heart', icon: Heart, colors: { color: '#e74c3c', bgColor: '#fdecea' } },
    { value: 'Brain', label: 'Brain', icon: Brain, colors: { color: '#3498db', bgColor: '#e8f4fd' } },
    { value: 'Bone', label: 'Bone', icon: Bone, colors: { color: '#2ecc71', bgColor: '#e8f8f0' } },
    { value: 'Eye', label: 'Eye', icon: Eye, colors: { color: '#9b59b6', bgColor: '#f4e8f7' } },
    { value: 'Stethoscope', label: 'Stethoscope', icon: Stethoscope, colors: { color: '#1abc9c', bgColor: '#e8faf5' } },
    { value: 'Shield', label: 'Shield', icon: Shield, colors: { color: '#f39c12', bgColor: '#fef5e8' } },
    { value: 'Microscope', label: 'Microscope', icon: Microscope, colors: { color: '#16a085', bgColor: '#e8f6f3' } },
    { value: 'Activity', label: 'Activity', icon: Activity, colors: { color: '#7f8c8d', bgColor: '#f0f0f0' } },
    { value: 'Users', label: 'Users', icon: Users, colors: { color: '#e67e22', bgColor: '#fef0e6' } }
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
    navigate('/doctors', { state: { speciality: speciality.name } });
  };

  const handleAddSpeciality = () => {
    setShowAddModal(true);
  };

  const handleEditClick = (speciality, e) => {
    e.stopPropagation();
    setEditSpeciality({
      id: speciality.id,
      name: speciality.name,
      description: speciality.description,
      icon: speciality.icon,
      color: speciality.color,
      bgColor: speciality.bgColor
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (speciality, e) => {
    e.stopPropagation();
    setSelectedSpeciality(speciality);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    
    if (!newSpeciality.name.trim()) {
      showWarningToast('Please enter speciality name', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newId = Math.max(...specialitiesData.map(s => s.id)) + 1;
      const newSpecialityData = {
        id: newId,
        name: newSpeciality.name,
        icon: newSpeciality.icon,
        color: newSpeciality.color,
        bgColor: newSpeciality.bgColor,
        description: newSpeciality.description,
        doctorsCount: 0
      };
      
      setSpecialitiesData(prev => [...prev, newSpecialityData]);
      
      showAddToast(
        `${newSpeciality.name} speciality has been added successfully!`,
        4000,
        {
          'Speciality': newSpeciality.name,
          'ID': `SP${String(newId).padStart(3, '0')}`
        }
      );
      
      setIsSubmitting(false);
      setShowAddModal(false);
      setNewSpeciality({
        name: '',
        description: '',
        icon: 'Heart',
        color: '#e74c3c',
        bgColor: '#fdecea'
      });
    }, 500);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    if (!editSpeciality.name.trim()) {
      showWarningToast('Please enter speciality name', 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      setSpecialitiesData(prev => prev.map(spec => 
        spec.id === editSpeciality.id 
          ? { 
              ...spec, 
              name: editSpeciality.name,
              description: editSpeciality.description,
              icon: editSpeciality.icon,
              color: editSpeciality.color,
              bgColor: editSpeciality.bgColor
            }
          : spec
      ));
      
      showUpdateToast(
        `${editSpeciality.name} speciality has been updated successfully!`,
        4000,
        {
          'Speciality': editSpeciality.name
        }
      );
      
      setIsSubmitting(false);
      setShowEditModal(false);
      setEditSpeciality({
        id: null,
        name: '',
        description: '',
        icon: 'Heart',
        color: '#e74c3c',
        bgColor: '#fdecea'
      });
    }, 500);
  };

  const handleDeleteConfirm = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      setSpecialitiesData(prev => prev.filter(spec => spec.id !== selectedSpeciality.id));
      
      showDeleteToast(
        `${selectedSpeciality.name} speciality has been deleted successfully!`,
        4000,
        {
          'Speciality': selectedSpeciality.name
        }
      );
      
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setSelectedSpeciality(null);
    }, 500);
  };

  const getIconComponent = (iconName) => {
    return iconComponents[iconName] || Heart;
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
          <Button onClick={handleAddSpeciality} className="flex items-center gap-2">
            <Plus size={16} /> New Speciality
          </Button>
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
              const Icon = getIconComponent(speciality.icon);
              const isHovered = hoveredCard === speciality.id;
              return (
                <div
                  key={speciality.id}
                  onMouseEnter={() => setHoveredCard(speciality.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group relative"
                >
                  {/* Edit and Delete Buttons - Visible on hover */}
                  <div className={`absolute top-3 right-3 flex gap-1.5 transition-opacity duration-200 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      onClick={(e) => handleEditClick(speciality, e)}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-blue-50 transition-colors border border-gray-200"
                      title="Edit Speciality"
                    >
                      <Edit2 size={14} className="text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(speciality, e)}
                      className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors border border-gray-200"
                      title="Delete Speciality"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                  
                  <div
                    onClick={() => handleSpecialityClick(speciality)}
                    className="p-5 cursor-pointer"
                  >
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

      {/* Add Speciality Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Speciality" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input 
            label="Speciality Name" 
            name="name" 
            value={newSpeciality.name} 
            onChange={(e) => setNewSpeciality(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Enter speciality name" 
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <select
              value={newSpeciality.icon}
              onChange={(e) => {
                const selectedIcon = iconOptions.find(opt => opt.value === e.target.value);
                setNewSpeciality(prev => ({ 
                  ...prev, 
                  icon: e.target.value,
                  color: selectedIcon?.colors.color || '#e74c3c',
                  bgColor: selectedIcon?.colors.bgColor || '#fdecea'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
            >
              {iconOptions.map(icon => (
                <option key={icon.value} value={icon.value}>{icon.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: newSpeciality.bgColor }}
            >
              {React.createElement(iconComponents[newSpeciality.icon] || Heart, { 
                size: 24, 
                style: { color: newSpeciality.color } 
              })}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Preview</p>
              <p className="text-xs text-gray-500">Icon will appear with selected colors</p>
            </div>
          </div>
          
          <Textarea 
            label="Description" 
            name="description" 
            rows={3} 
            value={newSpeciality.description} 
            onChange={(e) => setNewSpeciality(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Enter speciality description" 
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Speciality'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Speciality Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Speciality" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input 
            label="Speciality Name" 
            name="name" 
            value={editSpeciality.name} 
            onChange={(e) => setEditSpeciality(prev => ({ ...prev, name: e.target.value }))} 
            placeholder="Enter speciality name" 
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <select
              value={editSpeciality.icon}
              onChange={(e) => {
                const selectedIcon = iconOptions.find(opt => opt.value === e.target.value);
                setEditSpeciality(prev => ({ 
                  ...prev, 
                  icon: e.target.value,
                  color: selectedIcon?.colors.color || '#e74c3c',
                  bgColor: selectedIcon?.colors.bgColor || '#fdecea'
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C62A0]"
            >
              {iconOptions.map(icon => (
                <option key={icon.value} value={icon.value}>{icon.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: editSpeciality.bgColor }}
            >
              {React.createElement(iconComponents[editSpeciality.icon] || Heart, { 
                size: 24, 
                style: { color: editSpeciality.color } 
              })}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Preview</p>
              <p className="text-xs text-gray-500">Icon will appear with selected colors</p>
            </div>
          </div>
          
          <Textarea 
            label="Description" 
            name="description" 
            rows={3} 
            value={editSpeciality.description} 
            onChange={(e) => setEditSpeciality(prev => ({ ...prev, description: e.target.value }))} 
            placeholder="Enter speciality description" 
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Speciality" size="sm" showCloseButton={false}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete <span className="font-semibold">{selectedSpeciality?.name}</span> speciality?
          </p>
          <p className="text-xs text-red-500 mb-6">This action cannot be undone.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Specialities;