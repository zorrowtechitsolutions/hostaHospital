// src/components/super-admin/HospitalAppointmentsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, User, Stethoscope, Phone, Loader2, CheckCircle, XCircle, Clock as ClockIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '../../ui';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';
import { socket } from '../../../socket/socket';
import { registerBookingEvents, unregisterBookingEvents } from '../../../socket/bookingEvents';
// ✅ Import date formatter from shared utility
import { formatDate } from '../../../utils/dateFormatter';

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
        <span className="font-medium text-gray-700">{totalItems}</span> appointments
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

const HospitalAppointmentsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: bookingsData, isLoading: isLoadingAppointments, refetch, isFetching } = useGetBookingsQuery({
    hospitalId: id,
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  const { data: doctorsData, isLoading: isLoadingDoctors } = useGetDoctorsQuery({
    hospitalId: id,
    page: 1,
    limit: 100
  });

  const doctorMap = new Map();
  const allDoctors = doctorsData?.data || [];
  allDoctors.forEach(doctor => {
    doctorMap.set(String(doctor.id), {
      name: doctor.displayName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unknown',
      speciality: doctor.speciality,
      phone: doctor.phone
    });
  });

  const allAppointments = bookingsData?.data || [];
  const totalItems = bookingsData?.pagination?.totalItems || allAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Register socket event listeners
  useEffect(() => {
    registerBookingEvents({
      onBookingRegistered: () => {
        showSuccessToast(`New booking received!`, 3000);
        refetch();
      },
      onBookingUpdated: () => {
        showSuccessToast(`Booking updated!`, 3000);
        refetch();
      },
      onBookingCancelled: () => {
        showSuccessToast(`Booking cancelled!`, 3000);
        refetch();
      },
      onBookingAccepted: () => {
        showSuccessToast(`Booking accepted!`, 3000);
        refetch();
      },
      onBookingCompleted: () => {
        showSuccessToast(`Booking completed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterBookingEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerBookingEvents({
          onBookingRegistered: () => {
            showSuccessToast(`New booking received!`, 3000);
            refetch();
          },
          onBookingUpdated: () => {
            showSuccessToast(`Booking updated!`, 3000);
            refetch();
          },
          onBookingCancelled: () => {
            showSuccessToast(`Booking cancelled!`, 3000);
            refetch();
          },
          onBookingAccepted: () => {
            showSuccessToast(`Booking accepted!`, 3000);
            refetch();
          },
          onBookingCompleted: () => {
            showSuccessToast(`Booking completed!`, 3000);
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12} /> Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><ClockIcon size={12} /> Pending</Badge>;
      case 'declined':
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12} /> Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle size={12} /> Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctorMap.get(String(doctorId));
    if (doctor) return doctor.name;
    return 'Unknown';
  };

  const getDoctorSpeciality = (doctorId) => {
    const doctor = doctorMap.get(String(doctorId));
    if (doctor) return doctor.speciality;
    return null;
  };

  const isLoading = isLoadingAppointments || isLoadingDoctors;

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
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Appointments List</h1>
        <p className="text-sm text-gray-500 mt-1">
          Total Appointments: {totalItems}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search appointments by patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-gray-300 outline-none"
          />
        </div>
      </div>

      {allAppointments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allAppointments.map((appointment) => {
              const doctorName = getDoctorName(appointment.doctorId);
              const doctorSpeciality = getDoctorSpeciality(appointment.doctorId);
              
              return (
                <Card 
                  key={appointment.id} 
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {appointment.patient_name || appointment.patientName || 'Patient'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Token: {appointment.token || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Hospital ID: {appointment.hospitalId}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(appointment.status || appointment.booking_status)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm font-medium line-clamp-1">
                        {doctorName}
                      </span>
                    </div>
                    {doctorSpeciality && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{doctorSpeciality}</span>
                      </div>
                    )}
                    {appointment.department && !doctorSpeciality && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{appointment.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 my-2"></div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{formatDate(appointment.booking_date || appointment.appointmentDate) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{appointment.consulting_time || 'N/A'}</span>
                    </div>
                    {appointment.patient_phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{appointment.patient_phone}</span>
                      </div>
                    )}
                  </div>

                  {appointment.reason && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Reason:</span>
                        <p className="mt-0.5 line-clamp-2">{appointment.reason}</p>
                      </div>
                    </>
                  )}

                  {appointment.rejectionReason && (
                    <div className="mt-2 text-xs text-red-600">
                      <span className="font-medium">Rejected:</span>
                      <p className="mt-0.5 line-clamp-2">{appointment.rejectionReason}</p>
                    </div>
                  )}
                </Card>
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
          <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'No appointments match your search' : 'No appointments found for this hospital'}
          </p>
        </div>
      )}
    </div>
  );
};

export default HospitalAppointmentsList;