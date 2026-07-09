// src/components/super-admin/hospitals/HospitalDoctorsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Stethoscope, Phone, Mail, MapPin, Loader2, GraduationCap, Clock, Edit, Trash2, Plus, RotateCcw, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, Modal, Badge } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { useGetDoctorsQuery, useDeleteDoctorMutation, useRecoverDoctorMutation } from '../../../../app/service/doctorApi';
import { socket } from '../../../socket/socket';
import { registerDoctorEvents, unregisterDoctorEvents } from '../../../socket/doctorEvents';
import { getS3ImageUrl } from '../../../../app/service/S3';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// ================= HELPER FUNCTIONS =================

// Get S3 image URL with cache busting
const getImageUrlWithCache = (imageKey) => {
  if (!imageKey) return null;
  const url = getS3ImageUrl(imageKey);
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// ================= PAGINATION COMPONENT =================
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage,
  isLoading 
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to{' '}
        <span className="font-medium text-gray-700">{endItem}</span> of{' '}
        <span className="font-medium text-gray-700">{totalItems}</span> doctors
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === 1 || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span className="px-3 py-1.5 text-sm font-medium text-[#6366F1] bg-[#EEF2FF] rounded-md">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === totalPages || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const HospitalDoctorsList = () => {
  const { id: hospitalId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: doctorsData, isLoading, refetch, isFetching } = useGetDoctorsQuery({
    hospitalId: hospitalId,
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });
   
  const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();
  const [recoverDoctor, { isLoading: isRecovering }] = useRecoverDoctorMutation();

  const allDoctors = doctorsData?.data || [];
  const totalItems = doctorsData?.pagination?.totalItems || allDoctors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Register socket event listeners
  useEffect(() => {
    registerDoctorEvents({
      onDoctorRegistered: () => {
        showSuccessToast(`New doctor registered!`, 3000);
        refetch();
      },
      onDoctorUpdated: () => {
        showSuccessToast(`Doctor updated!`, 3000);
        refetch();
      },
      onDoctorDeleted: () => {
        showSuccessToast(`Doctor deleted!`, 3000);
        refetch();
      },
      onDoctorRecovered: () => {
        showSuccessToast(`Doctor recovered!`, 3000);
        refetch();
      },
      onDoctorPasswordReset: () => {
        showSuccessToast(`Doctor password reset!`, 3000);
        refetch();
      },
      onDoctorPasswordChanged: () => {
        showSuccessToast(`Doctor password changed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterDoctorEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerDoctorEvents({
          onDoctorRegistered: () => {
            showSuccessToast(`New doctor registered!`, 3000);
            refetch();
          },
          onDoctorUpdated: () => {
            showSuccessToast(`Doctor updated!`, 3000);
            refetch();
          },
          onDoctorDeleted: () => {
            showSuccessToast(`Doctor deleted!`, 3000);
            refetch();
          },
          onDoctorRecovered: () => {
            showSuccessToast(`Doctor recovered!`, 3000);
            refetch();
          },
          onDoctorPasswordReset: () => {
            showSuccessToast(`Doctor password reset!`, 3000);
            refetch();
          },
          onDoctorPasswordChanged: () => {
            showSuccessToast(`Doctor password changed!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [refetch, eventsRegistered]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const formatDoctorName = (doctor) => {
    const name = doctor?.displayName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || doctor?.name || 'Doctor';
    if (!name) return 'Doctor';
    if (name.toLowerCase().startsWith('dr.')) {
      return name;
    }
    if (name.toLowerCase().startsWith('dr ')) {
      return name.replace(/^dr\s/i, 'Dr. ');
    }
    return `Dr. ${name}`;
  };

  const getDoctorImage = (doctor) => {
    const imageKey = doctor?.imageUrl || doctor?.profileImage || doctor?.imageKey || doctor?.image || null;
    return imageKey ? getImageUrlWithCache(imageKey) : null;
  };

  const handleImageError = (doctorId) => {
    setImageErrors(prev => ({ ...prev, [doctorId]: true }));
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/super-admin/doctors/${doctorId}`);
  };

  const handleAddDoctor = () => {
    navigate(`/super-admin/hospitals/${hospitalId}/doctors/add`, { state: { hospitalId: hospitalId } });
  };

  const handleEditClick = (doctor, e) => {
    e.stopPropagation();
    navigate(`/super-admin/hospitals/${hospitalId}/doctors/edit/${doctor.id}`, { state: { doctor, hospitalId: hospitalId } });
    setActiveMenu(null);
  };

  const handleDeleteClick = (doctor, e) => {
    e.stopPropagation();
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (doctorToDelete) {
      try {
        await deleteDoctor(doctorToDelete.id).unwrap();
        
        socket.emit("doctor_event", {
          event: "DOCTOR_DELETED",
          data: {
            doctorId: doctorToDelete.id,
            doctorName: formatDoctorName(doctorToDelete),
            hospitalId: hospitalId,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${formatDoctorName(doctorToDelete)} deleted successfully!`);
        await refetch();
        setShowDeleteModal(false);
        setDoctorToDelete(null);
      } catch (error) {
        showErrorToast(error?.data?.message || 'Failed to delete doctor');
      }
    }
  };

  // ✅ NEW: Handle recover doctor
  const handleRecoverDoctor = async (doctor, e) => {
    e.stopPropagation();
    try {
      await recoverDoctor(doctor.id).unwrap();
      
      socket.emit("doctor_event", {
        event: "DOCTOR_RECOVERED",
        data: {
          doctorId: doctor.id,
          doctorName: formatDoctorName(doctor),
          hospitalId: hospitalId,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`${formatDoctorName(doctor)} recovered successfully!`);
      await refetch();
      setActiveMenu(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to recover doctor');
    }
  };

  const toggleMenu = (doctorId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === doctorId ? null : doctorId);
  };

  // ✅ NEW: Doctor Action Menu component
  const DoctorActionMenu = ({ doctor }) => {
    const isDeleted = doctor.isDelete;
    const doctorId = doctor.id;

    return (
      <div className="relative inline-block menu-container">
        <button 
          onClick={(e) => toggleMenu(doctorId, e)} 
          className={`p-1 rounded transition-colors ${isDeleted ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          disabled={isDeleted}
        >
          <MoreVertical size={18} className={isDeleted ? 'text-gray-300' : 'text-gray-600'} />
        </button>
        {activeMenu === doctorId && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {!isDeleted ? (
              <>
                <button 
                  onClick={() => { handleDoctorClick(doctor.id); setActiveMenu(null); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>
                <button 
                  onClick={(e) => handleEditClick(doctor, e)} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={16} /> Edit
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={(e) => handleDeleteClick(doctor, e)} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => handleRecoverDoctor(doctor, e)} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
              >
                <RotateCcw size={16} /> Recover Doctor
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/super-admin/hospitals/${hospitalId}`)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
          <Button
            variant="primary"
            onClick={handleAddDoctor}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Doctor
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Doctors List</h1>
        <p className="text-sm text-gray-500 mt-1">
          Total Doctors: {totalItems}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-gray-300 outline-none"
          />
        </div>
      </div>

      {allDoctors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDoctors.map((doctor) => {
              const imageUrl = getDoctorImage(doctor);
              const hasImageError = imageErrors[doctor.id];
              const doctorName = formatDoctorName(doctor);
              const isDeleted = doctor.isDelete;
              const isInactive = !doctor.isActive && !isDeleted;
              const isDisabled = isDeleted || isInactive;
              
              return (
                <div 
                  key={doctor.id} 
                  onClick={() => !isDisabled && handleDoctorClick(doctor.id)}
                  className={`cursor-pointer transition-all duration-200 ${!isDisabled ? 'hover:scale-105' : ''}`}
                >
                  <Card className={`p-4 transition-shadow flex flex-col h-full ${isDeleted ? 'bg-gray-50 border-gray-300 opacity-60' : isInactive ? 'bg-gray-50 border-gray-200' : 'hover:shadow-lg'}`}>
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className={`w-10 h-10 ${isDeleted ? 'opacity-60' : ''}`}>
                        {imageUrl && !hasImageError ? (
                          <AvatarImage 
                            src={imageUrl} 
                            alt={doctorName}
                            className="object-cover"
                            onError={() => handleImageError(doctor.id)}
                          />
                        ) : (
                          <AvatarFallback className={`${isDeleted ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-green-500 to-green-600 text-white'} text-sm font-medium`}>
                            {doctorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold truncate ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                              {doctorName}
                            </h3>
                            <p className="text-xs text-gray-500">ID: {doctor.id}</p>
                            <p className="text-xs text-gray-400">Hospital ID: {doctor.hospitalId}</p>
                          </div>
                          <DoctorActionMenu doctor={doctor} />
                        </div>
                        {isDeleted && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 mt-1">
                            Blacklisted
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge variant="secondary" className="text-xs bg-gray-300 text-gray-600 mt-1">
                            Inactive
                          </Badge>
                        )}
                        <div className="space-y-1 mt-2">
                          {doctor.speciality && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                              <span className={`truncate ${isDisabled ? 'text-gray-400' : ''}`}>{doctor.speciality}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={isDisabled ? 'text-gray-400' : ''}>{doctor.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={isDisabled ? 'text-gray-400' : ''}>{doctor.email}</span>
                          </div>
                          {doctor.qualification && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <GraduationCap size={14} className="text-gray-400 flex-shrink-0" />
                              <span className={isDisabled ? 'text-gray-400' : ''}>{doctor.qualification}</span>
                            </div>
                          )}
                          {doctor.experience && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={14} className="text-gray-400 flex-shrink-0" />
                              <span className={isDisabled ? 'text-gray-400' : ''}>{doctor.experience} years experience</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isDeleted && (
                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleEditClick(doctor, e)}
                          className="flex items-center gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={(e) => handleDeleteClick(doctor, e)}
                          disabled={isDeleting}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}

                    {isDeleted && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button 
                          onClick={(e) => handleRecoverDoctor(doctor, e)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          <RotateCcw size={14} /> Recover Doctor
                        </button>
                      </div>
                    )}

                    {isInactive && !isDeleted && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="w-full flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                          Inactive Doctor
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Pagination Component - Simplified with < Prev 1 Next > */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            isLoading={isLoading || isFetching}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Stethoscope size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'No doctors match your search' : 'No doctors found for this hospital'}
          </p>
          <Button
            variant="primary"
            onClick={handleAddDoctor}
            className="mt-4 flex items-center gap-2 mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={18} />
            Add Your First Doctor
          </Button>
        </div>
      )}

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setDoctorToDelete(null);
        }} 
        title="Delete Doctor" 
        size="sm"
      >
        <div className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{doctorToDelete ? formatDoctorName(doctorToDelete) : ''}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDoctorToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Doctor'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalDoctorsList;