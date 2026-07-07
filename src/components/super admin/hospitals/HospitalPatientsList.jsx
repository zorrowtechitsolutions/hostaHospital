// src/components/super-admin/HospitalPatientsList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, User, Phone, Mail, MapPin, Loader2, 
  Calendar, Droplet, MoreVertical, Eye, Edit, Trash2, 
  Plus, RotateCcw
} from 'lucide-react';
import { Card, Button, Pagination, Badge } from '../../ui';
import { 
  useGetPatientsQuery, 
  useDeletePatientMutation,
  useRecoverPatientMutation
} from '../../../../app/service/patients';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerPatientEvents, unregisterPatientEvents } from '../../../socket/patientEvents';
import DeleteModal from '../../patients/DeleteModel';
import AddAppointmentModal from '../../patients/AddAppointmentModal';
import ApproveRequestModal from '../../Requests/ApproveRequestModel';
import { useCreateBookingMutation } from '../../../../app/service/request';
import { getHospitalId, isDoctor, isStaff, isHospitalAdmin } from '../../../utils/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../../app/service/S3';

// ================= HELPER FUNCTIONS =================

// Get S3 image URL with cache busting
const getImageUrlWithCache = (imageKey) => {
  if (!imageKey) return null;
  const url = getS3ImageUrl(imageKey);
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

const HospitalPatientsList = () => {
  // ✅ Get hospital ID from route params - same as HospitalDoctorsList
  const { id: hospitalId } = useParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const itemsPerPage = 10;

  const [eventsRegistered, setEventsRegistered] = useState(false);
  
  // Modal states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentPatient, setAppointmentPatient] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  
  // Menu state
  const [activeMenu, setActiveMenu] = useState(null);

  // Auth - same as HospitalDoctorsList
  const authHospitalId = getHospitalId();
  const isDoctorRole = isDoctor();
  const isStaffRole = isStaff();
  const isHospitalAdminRole = isHospitalAdmin();
  const canModifyPatients = isHospitalAdminRole || (!isDoctorRole && !isStaffRole);

  console.log("🏥 Hospital ID from route:", hospitalId);
  console.log("🏥 Hospital ID from auth:", authHospitalId);

  // ✅ Use hospitalId from route params - same as HospitalDoctorsList
  const { data: patientsData, isLoading, refetch, isFetching } = useGetPatientsQuery({
    hospitalId: hospitalId,
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  console.log("Search Term:", searchTerm); // 👈 ADD HERE
  console.log("Patients Data:", patientsData); // 👈 ADD HERE

  const [deletePatient] = useDeletePatientMutation();
  const [recoverPatient] = useRecoverPatientMutation();
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  const patients = patientsData?.data || [];
  const totalItems = patientsData?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Transform data
  const transformPatientData = (patients) => {
    if (!patients || !Array.isArray(patients)) return [];
    return patients.map((patient) => ({
      ...patient,
      isDelete: patient.isDelete || false,
      isActive: patient.isActive !== undefined ? patient.isActive : true
    }));
  };

  const transformedPatients = transformPatientData(patients);

  // Helper functions
  const formatPatientId = (id) => {
    if (!id) return '#PT0000';
    return `#PT00${String(id).slice(-6)}`;
  };

  const getPatientImage = (patient) => {
    const imageKey = patient?.imageKey || patient?.profileImage || patient?.image || null;
    return imageKey ? getImageUrlWithCache(imageKey) : null;
  };

  const handleImageError = (patientId) => {
    setImageErrors(prev => ({ ...prev, [patientId]: true }));
  };

  // ✅ CRUD Handlers with hospitalId
  const handleAddPatient = () => {
    if (!canModifyPatients) {
      showErrorToast('You do not have permission to add patients', 3000);
      return;
    }
    // ✅ Navigate to nested patient add route with hospitalId in state
    navigate(`/super-admin/hospitals/${hospitalId}/patients/add`, {
      state: { hospitalId: hospitalId }
    });
  };

  const handleViewDetails = (patient) => {
    if (patient.isDelete) {
      showErrorToast("Cannot view details of deleted patient", 3000);
      return;
    }
    if (!patient.isActive) {
      showErrorToast("Cannot view details of inactive patient", 3000);
      return;
    }

    const patientId = patient.id || patient._id;
    // ✅ Navigate to nested patient details route
    navigate(`/super-admin/hospitals/${hospitalId}/patients/${patientId}`, {
      state: {
        patient,
        hospitalId: hospitalId,
        returnPath: window.location.pathname,
      },
    });
    setActiveMenu(null);
  };

  const handleEditPatient = (patient) => {
    if (!canModifyPatients) {
      showErrorToast('You do not have permission to edit patients', 3000);
      return;
    }
    if (patient.isDelete) {
      showErrorToast('Cannot edit deleted patient', 3000);
      return;
    }
    if (!patient.isActive) {
      showErrorToast('Cannot edit inactive patient', 3000);
      return;
    }
    
    const patientId = patient.id || patient._id;
    // ✅ Navigate to nested patient edit route
    navigate(`/super-admin/hospitals/${hospitalId}/patients/edit/${patientId}`, {
      state: {
        patient,
        hospitalId: hospitalId,
        returnPath: window.location.pathname
      }
    });
    setActiveMenu(null);
  };

  const handleDeleteClick = (patient) => {
    if (!canModifyPatients) {
      showErrorToast('You do not have permission to delete patients', 3000);
      return;
    }
    if (!patient.isActive) {
      showErrorToast('Cannot delete inactive patient', 3000);
      return;
    }
    setPatientToDelete(patient);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await deletePatient(patientToDelete.id || patientToDelete._id).unwrap();
      
      socket.emit("patient_event", {
        event: "PATIENT_DELETED",
        data: {
          patientId: patientToDelete.id || patientToDelete._id,
          patientName: patientToDelete.name,
          hospitalId: hospitalId,
          timestamp: new Date().toISOString()
        }
      });
      
      await refetch();
      setShowModal(false);
      setPatientToDelete(null);
      showSuccessToast(`${patientToDelete.name} has been deleted successfully!`, 2000);
    } catch (error) {
      showErrorToast('Failed to delete patient. Please try again.', 3000);
    }
  };

  const handleRecoverPatient = async (patient) => {
    if (!canModifyPatients) {
      showErrorToast('You do not have permission to recover patients', 3000);
      return;
    }
    try {
      await recoverPatient(patient.id || patient._id).unwrap();
      
      socket.emit("patient_event", {
        event: "PATIENT_RECOVERED",
        data: {
          patientId: patient.id || patient._id,
          patientName: patient.name,
          hospitalId: hospitalId,
          timestamp: new Date().toISOString()
        }
      });
      
      showSuccessToast(`${patient.name} recovered successfully!`, 2000);
      refetch();
      setActiveMenu(null);
    } catch (error) {
      showErrorToast(error?.data?.message || 'Failed to recover patient', 3000);
    }
  };

  const handleAddAppointmentModal = (patient) => {
    if (patient.isDelete) {
      showErrorToast('Cannot create appointment for deleted patient', 3000);
      return;
    }
    if (!patient.isActive) {
      showErrorToast('Cannot create appointment for inactive patient', 3000);
      return;
    }
    setAppointmentPatient(patient);
    setShowAppointmentModal(true);
    setActiveMenu(null);
  };

  const handleProceedApprove = (data) => {
    const patientId = appointmentPatient?.id || appointmentPatient?._id;
    setBookingData({
      ...data,
      patientId: patientId ? `#PT00${String(patientId)}` : null,
    });
    setShowAppointmentModal(false);
    setShowApproveModal(true);
  };

  const handleConfirmAppointment = async (approveData) => {
    try {
      const payload = {
        patientId: bookingData?.patientId ? Number(bookingData.patientId.replace("#PT00", "")) : null,
        userId: Number(bookingData?.userId),
        patient_name: bookingData?.patient_name,
        patient_dob: bookingData?.patient_dob,
        patient_place: bookingData?.patient_place,
        patient_phone: bookingData?.patient_phone,
        patient_age: bookingData?.patient_age,
        patient_gender: bookingData?.patient_gender || appointmentPatient?.gender,
        hospitalId: Number(bookingData?.hospitalId),
        doctorId: Number(bookingData?.doctorId),
        booking_date: approveData?.booking_date,
        department: bookingData?.department,
        displayName: bookingData?.displayName,
        consulting_time: approveData?.consulting_time,
        token: approveData?.token ? parseInt(approveData.token) : null,
        status: "accepted",
        booking_status: "hospital booking"
      };

      await createBooking(payload).unwrap();

      showSuccessToast("Appointment confirmed successfully!", 4000);
      setShowApproveModal(false);
      setBookingData(null);
      setAppointmentPatient(null);
      navigate('/super-admin/appointments');
    } catch (err) {
      showErrorToast(err?.data?.message || "Failed to confirm appointment", 3000);
    }
  };

  // Register socket event listeners
  useEffect(() => {
    registerPatientEvents({
      onPatientRegistered: () => {
        showSuccessToast(`New patient registered!`, 3000);
        refetch();
      },
      onPatientUpdated: () => {
        showSuccessToast(`Patient updated!`, 3000);
        refetch();
      },
      onPatientDeleted: () => {
        showSuccessToast(`Patient deleted!`, 3000);
        refetch();
      },
      onPatientRecovered: () => {
        showSuccessToast(`Patient recovered!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterPatientEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerPatientEvents({
          onPatientRegistered: () => {
            showSuccessToast(`New patient registered!`, 3000);
            refetch();
          },
          onPatientUpdated: () => {
            showSuccessToast(`Patient updated!`, 3000);
            refetch();
          },
          onPatientDeleted: () => {
            showSuccessToast(`Patient deleted!`, 3000);
            refetch();
          },
          onPatientRecovered: () => {
            showSuccessToast(`Patient recovered!`, 3000);
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

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (patientId) => {
    setActiveMenu(activeMenu === patientId ? null : patientId);
  };

  // Row Action Menu with 3 dots
  const RowActionMenu = ({ patient }) => {
    const isDeleted = patient.isDelete;
    const isInactive = !patient.isActive && !isDeleted;
    const isDisabled = isDeleted || isInactive;
    const patientId = patient.id || patient._id;

    return (
      <div className="relative inline-block">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) {
              toggleMenu(patientId);
            }
          }} 
          className={`p-2 rounded transition-colors ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          disabled={isDisabled}
        >
          <MoreVertical size={18} className={isDisabled ? 'text-gray-300' : 'text-gray-600'} />
        </button>
        {activeMenu === patientId && !isDisabled && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          >
            {!isDeleted && (
              <>
                <button 
                  onClick={() => { handleViewDetails(patient); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye size={16} /> View Details
                </button>
                {canModifyPatients && (
                  <button 
                    onClick={() => { handleEditPatient(patient); }} 
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit size={16} /> Edit
                  </button>
                )}
                <button 
                  onClick={() => { handleAddAppointmentModal(patient); }} 
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                >
                  <Calendar size={16} /> Add Appointment
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                {canModifyPatients && (
                  <button 
                    onClick={() => { handleDeleteClick(patient); }} 
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </>
            )}
            {isDeleted && canModifyPatients && (
              <button 
                onClick={() => { handleRecoverPatient(patient); }} 
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
              >
                <RotateCcw size={16} /> Recover Patient
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
      {/* Header with Add Patient Button */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          {/* ✅ Fixed: Navigate back to hospital details with the hospital ID */}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/super-admin/hospitals/${hospitalId}`)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
          {canModifyPatients && (
            <Button 
              onClick={handleAddPatient} 
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={16} /> Add Patient
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Patients List</h1>
        <p className="text-sm text-gray-500 mt-1">Total Patients: {totalItems}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {transformedPatients.map((patient) => {
          const isDeleted = patient.isDelete;
          const isInactive = !patient.isActive && !isDeleted;
          const isDisabled = isDeleted || isInactive;
          const imageUrl = getPatientImage(patient);
          const hasImageError = imageErrors[patient.id || patient._id];
          const patientName = patient.name || 'Patient';
          
          return (
            <Card 
              key={patient.id || patient._id} 
              className={`p-4 transition-shadow ${
                isDeleted 
                  ? 'bg-gray-50 border-gray-300 opacity-60' 
                  : isInactive
                  ? 'bg-gray-50 border-gray-200'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className={`w-12 h-12 ${isDeleted ? 'opacity-60' : ''}`}>
                  {imageUrl && !hasImageError ? (
                    <AvatarImage 
                      src={imageUrl} 
                      alt={patientName}
                      className="object-cover"
                      onError={() => handleImageError(patient.id || patient._id)}
                    />
                  ) : (
                    <AvatarFallback className={`${isDeleted ? 'bg-gray-300 text-gray-500' : 'bg-blue-100 text-blue-600'} text-base font-medium`}>
                      {patientName.charAt(0)?.toUpperCase() || "P"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                        {patientName}
                      </h3>
                      <p className="text-xs text-gray-500">ID: {formatPatientId(patient.id || patient._id)}</p>
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
                    </div>
                    <RowActionMenu patient={patient} />
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      <span className={isDisabled ? 'text-gray-400' : ''}>{patient.mobileNumber}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span className={isDisabled ? 'text-gray-400' : ''}>{patient.email}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} className="text-gray-400" />
                        <span className={isDisabled ? 'text-gray-400' : ''}>{patient.gender}, {patient.age || 'N/A'} years</span>
                      </div>
                    )}
                    {patient.bloodGroup && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Droplet size={14} className="text-gray-400" />
                        <span className={isDisabled ? 'text-gray-400' : ''}>Blood Group: {patient.bloodGroup}</span>
                      </div>
                    )}
                    {patient.patientType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span className={isDisabled ? 'text-gray-400' : ''}>Type: {patient.patientType}</span>
                      </div>
                    )}
                    {patient.addressLine && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                        <span className={isDisabled ? 'text-gray-400' : ''}>{patient.addressLine}</span>
                      </div>
                    )}
                  </div>
                  {isDeleted && canModifyPatients && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => handleRecoverPatient(patient)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        <RotateCcw size={14} /> Recover Patient
                      </button>
                    </div>
                  )}
                  {isInactive && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="w-full flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                        Inactive Patient
                      </div>
                    </div>
                  )}
                  {!isDeleted && !isInactive && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => handleAddAppointmentModal(patient)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        <Calendar size={14} /> Add Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {transformedPatients.length === 0 && (
        <div className="text-center py-12">
          <User size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No patients found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemLabel="patients"
          />
        </div>
      )}

      {/* Modals */}
      {showAppointmentModal && (
        <AddAppointmentModal
          isOpen={showAppointmentModal}
          patient={appointmentPatient}
          onClose={() => setShowAppointmentModal(false)}
          onProceedApprove={handleProceedApprove}
        />
      )}

      {showApproveModal && bookingData && (
        <ApproveRequestModal
          requestData={bookingData}
          initialDate={bookingData?.booking_date}
          onClose={() => {
            setShowApproveModal(false);
            setBookingData(null);
          }}
          onConfirm={handleConfirmAppointment}
          isLoading={isCreatingBooking}
        />
      )}

      <DeleteModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Patient"
        message="Are you sure you want to delete this patient? This action cannot be undone."
        itemName={patientToDelete?.name}
      />
    </div>
  );
};

export default HospitalPatientsList;