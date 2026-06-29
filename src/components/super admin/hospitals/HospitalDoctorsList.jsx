// src/components/super-admin/hospitals/HospitalDoctorsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Stethoscope, Phone, Mail, MapPin, Loader2, GraduationCap, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { Card, Button, Pagination, Modal } from '../../ui';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { useGetDoctorsQuery, useDeleteDoctorMutation } from '../../../../app/service/doctorApi';

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerDoctorEvents, unregisterDoctorEvents } from '../../../socket/doctorEvents';

const HospitalDoctorsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const itemsPerPage = 10;

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // ✅ FIXED: Pass hospitalId to API so backend can filter
  const { data: doctorsData, isLoading, refetch } = useGetDoctorsQuery({
    hospitalId: id,  // ← CRITICAL: Pass hospital ID from URL
    page: currentPage,  // Use currentPage for pagination
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });
   
  const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();

  const allDoctors = doctorsData?.data || [];
  const totalItems = doctorsData?.pagination?.totalItems || allDoctors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // ✅ Register socket event listeners for doctor events
  useEffect(() => {
    console.log("🔄 Registering doctor event listeners for Hospital Doctors...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerDoctorEvents({
      onDoctorRegistered: (data) => {
        console.log("👨‍⚕️ NEW DOCTOR REGISTERED:", data);
        showSuccessToast(`New doctor registered!`, 3000);
        refetch();
      },
      
      onDoctorUpdated: (data) => {
        console.log("✏️ DOCTOR UPDATED:", data);
        showSuccessToast(`Doctor updated!`, 3000);
        refetch();
      },
      
      onDoctorDeleted: (data) => {
        console.log("🗑️ DOCTOR DELETED:", data);
        showSuccessToast(`Doctor deleted!`, 3000);
        refetch();
      },
      
      onDoctorRecovered: (data) => {
        console.log("♻️ DOCTOR RECOVERED:", data);
        showSuccessToast(`Doctor recovered!`, 3000);
        refetch();
      },
      
      onDoctorPasswordReset: (data) => {
        console.log("🔑 DOCTOR PASSWORD RESET:", data);
        showSuccessToast(`Doctor password reset!`, 3000);
        refetch();
      },
      
      onDoctorPasswordChanged: (data) => {
        console.log("🔐 DOCTOR PASSWORD CHANGED:", data);
        showSuccessToast(`Doctor password changed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering doctor events for Hospital Doctors...");
      unregisterDoctorEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Doctor events will work!");
      if (!eventsRegistered) {
        registerDoctorEvents({
          onDoctorRegistered: (data) => {
            console.log("👨‍⚕️ NEW DOCTOR REGISTERED (reconnect):", data);
            showSuccessToast(`New doctor registered!`, 3000);
            refetch();
          },
          onDoctorUpdated: (data) => {
            console.log("✏️ DOCTOR UPDATED (reconnect):", data);
            showSuccessToast(`Doctor updated!`, 3000);
            refetch();
          },
          onDoctorDeleted: (data) => {
            console.log("🗑️ DOCTOR DELETED (reconnect):", data);
            showSuccessToast(`Doctor deleted!`, 3000);
            refetch();
          },
          onDoctorRecovered: (data) => {
            console.log("♻️ DOCTOR RECOVERED (reconnect):", data);
            showSuccessToast(`Doctor recovered!`, 3000);
            refetch();
          },
          onDoctorPasswordReset: (data) => {
            console.log("🔑 DOCTOR PASSWORD RESET (reconnect):", data);
            showSuccessToast(`Doctor password reset!`, 3000);
            refetch();
          },
          onDoctorPasswordChanged: (data) => {
            console.log("🔐 DOCTOR PASSWORD CHANGED (reconnect):", data);
            showSuccessToast(`Doctor password changed!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Doctor events won't work!");
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetch, eventsRegistered]);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - DOCTOR/HOSPITAL: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    if (allDoctors.length > 0) {
      console.log("=== HOSPITAL DOCTORS LIST DEBUG ===");
      console.log("Hospital ID from URL:", id);
      console.log("Doctors Data from API:", doctorsData);
      console.log("All Doctors:", allDoctors);
      console.log("Total Items:", totalItems);
      
      // Log what hospitalIds are in the response
      const uniqueHospitalIds = [...new Set(allDoctors.map(d => d.hospitalId))];
      console.log("Unique hospitalIds in response:", uniqueHospitalIds);
    }
  }, [id, doctorsData, allDoctors, totalItems]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper function to format doctor name with Dr. prefix
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

  // Navigate to doctor details page
  const handleDoctorClick = (doctorId) => {
    navigate(`/super-admin/doctors/${doctorId}`);
  };

  // Handle add new doctor
  const handleAddDoctor = () => {
    navigate('/super-admin/doctors/add', { state: { hospitalId: id } });
  };

  // Handle edit doctor
  const handleEditClick = (doctor, e) => {
    e.stopPropagation();
    navigate(`/super-admin/doctors/edit/${doctor.id}`, { state: { doctor, hospitalId: id } });
  };

  // Handle delete doctor
  const handleDeleteClick = (doctor, e) => {
    e.stopPropagation();
    setDoctorToDelete(doctor);
    setShowModal(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (doctorToDelete) {
      try {
        await deleteDoctor(doctorToDelete.id).unwrap();
        
        // ✅ Emit socket event for doctor deleted
        socket.emit("doctor_event", {
          event: "DOCTOR_DELETED",
          data: {
            doctorId: doctorToDelete.id,
            doctorName: formatDoctorName(doctorToDelete),
            hospitalId: id,
            timestamp: new Date().toISOString()
          }
        });
        
        showSuccessToast(`${formatDoctorName(doctorToDelete)} deleted successfully!`);
        await refetch();
        setShowModal(false);
        setDoctorToDelete(null);
      } catch (error) {
        console.error('Error deleting doctor:', error);
        showErrorToast(error?.data?.message || 'Failed to delete doctor');
      }
    }
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
      {/* Header with Back Button and Add Doctor Button */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {allDoctors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                onClick={() => handleDoctorClick(doctor.id)}
                className="cursor-pointer transition-all duration-200 hover:scale-105"
              >
                <Card className="p-4 hover:shadow-lg transition-shadow flex flex-col h-full">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{formatDoctorName(doctor)}</h3>
                      <p className="text-xs text-gray-500">ID: {doctor.id}</p>
                      <p className="text-xs text-gray-400">Hospital ID: {doctor.hospitalId}</p>
                      <div className="space-y-1 mt-2">
                        {doctor.speciality && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{doctor.speciality}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{doctor.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.qualification && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <GraduationCap size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{doctor.qualification}</span>
                          </div>
                        )}
                        {doctor.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} className="text-gray-400 flex-shrink-0" />
                            <span>{doctor.experience} years experience</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
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
                </Card>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="doctors"
              />
            </div>
          )}
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

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
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
                  setShowModal(false);
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