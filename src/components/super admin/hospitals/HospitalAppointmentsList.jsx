// src/components/super-admin/HospitalAppointmentsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, User, Stethoscope, Phone, Loader2, CheckCircle, XCircle, Clock as ClockIcon, MapPin } from 'lucide-react';
import { Card, Button, Pagination, Badge } from '../../ui';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerBookingEvents, unregisterBookingEvents } from '../../../socket/bookingEvents';

const HospitalAppointmentsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // ✅ FIXED: Pass hospitalId to API so backend can filter
  const { data: bookingsData, isLoading: isLoadingAppointments, refetch } = useGetBookingsQuery({
    hospitalId: id,  // ← CRITICAL: Pass hospital ID from URL
    page: currentPage,  // Use currentPage for pagination
    limit: itemsPerPage,
    search_query: searchTerm || undefined
  });

  // Fetch all doctors to get doctor names
  const { data: doctorsData, isLoading: isLoadingDoctors } = useGetDoctorsQuery({
    hospitalId: id,  // Also filter doctors by hospital
    page: 1,
    limit: 1000
  });

  // Create a doctor lookup map
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

  // ✅ Register socket event listeners for booking events
  useEffect(() => {
    console.log("🔄 Registering booking event listeners for Hospital Appointments...");
    console.log("📡 Socket connected:", socket.connected);
    
    registerBookingEvents({
      onBookingRegistered: (data) => {
        console.log("📅 NEW BOOKING REGISTERED:", data);
        showSuccessToast(`New booking received!`, 3000);
        refetch();
      },
      
      onBookingUpdated: (data) => {
        console.log("✏️ BOOKING UPDATED:", data);
        showSuccessToast(`Booking updated!`, 3000);
        refetch();
      },
      
      onBookingCancelled: (data) => {
        console.log("❌ BOOKING CANCELLED:", data);
        showSuccessToast(`Booking cancelled!`, 3000);
        refetch();
      },
      
      onBookingAccepted: (data) => {
        console.log("✅ BOOKING ACCEPTED:", data);
        showSuccessToast(`Booking accepted!`, 3000);
        refetch();
      },
      
      onBookingCompleted: (data) => {
        console.log("✔️ BOOKING COMPLETED:", data);
        showSuccessToast(`Booking completed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering booking events for Hospital Appointments...");
      unregisterBookingEvents();
      setEventsRegistered(false);
    };
  }, [refetch]);

  // ✅ Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Booking events will work!");
      if (!eventsRegistered) {
        registerBookingEvents({
          onBookingRegistered: (data) => {
            console.log("📅 NEW BOOKING REGISTERED (reconnect):", data);
            showSuccessToast(`New booking received!`, 3000);
            refetch();
          },
          onBookingUpdated: (data) => {
            console.log("✏️ BOOKING UPDATED (reconnect):", data);
            showSuccessToast(`Booking updated!`, 3000);
            refetch();
          },
          onBookingCancelled: (data) => {
            console.log("❌ BOOKING CANCELLED (reconnect):", data);
            showSuccessToast(`Booking cancelled!`, 3000);
            refetch();
          },
          onBookingAccepted: (data) => {
            console.log("✅ BOOKING ACCEPTED (reconnect):", data);
            showSuccessToast(`Booking accepted!`, 3000);
            refetch();
          },
          onBookingCompleted: (data) => {
            console.log("✔️ BOOKING COMPLETED (reconnect):", data);
            showSuccessToast(`Booking completed!`, 3000);
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Booking events won't work!");
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
      console.log(`📡 ALL SOCKET EVENTS - BOOKING/HOSPITAL: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    if (allAppointments.length > 0) {
      console.log("=== HOSPITAL APPOINTMENTS LIST DEBUG ===");
      console.log("Hospital ID from URL:", id);
      console.log("Appointments Data from API:", bookingsData);
      console.log("Total Appointments:", totalItems);
      console.log("Doctor Map Size:", doctorMap.size);
      
      // Log what hospitalIds are in the response
      const uniqueHospitalIds = [...new Set(allAppointments.map(a => a.hospitalId))];
      console.log("Unique hospitalIds in response:", uniqueHospitalIds);
    }
  }, [id, bookingsData, allAppointments, totalItems, doctorMap]);

  // Reset to page 1 when search term changes
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
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back to Hospital Details
        </Button>
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
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
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
                  {/* Header with Status */}
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

                  {/* Doctor Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Stethoscope size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 text-sm font-medium line-clamp-1">
                        Dr. {doctorName}
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

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-2"></div>

                  {/* Appointment Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{appointment.booking_date || appointment.appointmentDate || 'N/A'}</span>
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

                  {/* Reason (if exists) */}
                  {appointment.reason && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Reason:</span>
                        <p className="mt-0.5 line-clamp-2">{appointment.reason}</p>
                      </div>
                    </>
                  )}

                  {/* Rejection Reason (if exists) */}
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

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="appointments"
              />
            </div>
          )}
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