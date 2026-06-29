// src/components/super-admin/HospitalVisitList.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, User, Stethoscope, Phone, Loader2, CheckCircle, XCircle, Clock as ClockIcon, MapPin, Users as UsersIcon, Filter, RefreshCcw, Download, Upload, MoreVertical, Eye, Edit, Trash2, PlayCircle } from 'lucide-react';
import { Card, Button, Pagination, Badge, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Modal } from '../../ui';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../../app/service/S3';

// ✅ Import socket
import { socket } from '../../../socket/socket';
// ✅ Import socket event listeners
import { registerBookingEvents, unregisterBookingEvents } from '../../../socket/bookingEvents';

// Helper functions for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
};

const formatDateTime = (date, time) => {
  if (!date) return "N/A";
  try {
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    return `${formattedDate} ${time || ""}`.trim();
  } catch (error) {
    return "N/A";
  }
};

const HospitalVisitList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  // ✅ Track if events are registered
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // API Hooks - Get only accepted (visit) bookings
  const { data: bookingsData, isLoading, refetch, isFetching } = useGetBookingsQuery({
    hospitalId: id,
    status: "accepted",
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined,
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter })
  });

  // Fetch doctors to get doctor names
  const { data: doctorsData, isLoading: isLoadingDoctors } = useGetDoctorsQuery({
    hospitalId: id,
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
      phone: doctor.phone,
      imageKey: doctor.imageKey || null
    });
  });

  const allVisits = bookingsData?.data || [];
  const totalItems = bookingsData?.pagination?.totalItems || allVisits.length;
  const totalPages = bookingsData?.pagination?.totalPages || Math.ceil(totalItems / itemsPerPage);

  // ✅ Register socket event listeners for booking events
  useEffect(() => {
    console.log("🔄 Registering booking event listeners for Hospital Visits...");
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
        showWarningToast(`Booking cancelled!`, 3000);
        refetch();
      },
      
      onBookingAccepted: (data) => {
        console.log("✅ BOOKING ACCEPTED (New Visit):", data);
        showSuccessToast(`New visit added!`, 3000);
        refetch();
      },
      
      onBookingCompleted: (data) => {
        console.log("✔️ BOOKING COMPLETED:", data);
        showSuccessToast(`Visit completed!`, 3000);
        refetch();
      }
    });

    setEventsRegistered(true);

    return () => {
      console.log("🧹 Unregistering booking events for Hospital Visits...");
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
            showWarningToast(`Booking cancelled!`, 3000);
            refetch();
          },
          onBookingAccepted: (data) => {
            console.log("✅ BOOKING ACCEPTED (reconnect):", data);
            showSuccessToast(`New visit added!`, 3000);
            refetch();
          },
          onBookingCompleted: (data) => {
            console.log("✔️ BOOKING COMPLETED (reconnect):", data);
            showSuccessToast(`Visit completed!`, 3000);
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
      console.log(`📡 ALL SOCKET EVENTS - BOOKING/VISIT: ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, dateFilter]);

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

  const getDoctorImage = (doctorId) => {
    const doctor = doctorMap.get(String(doctorId));
    if (doctor) return doctor.imageKey;
    return null;
  };

  const getActiveFilterCount = () => {
    return (departmentFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (searchTerm ? 1 : 0);
  };

  const activeFilterCount = getActiveFilterCount();

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  };

  const handleStartVisit = (visit) => {
    navigate('/appointments/consultation', {
      state: {
        visit,
        patientName: visit.patient_name || visit.patientName,
        patientId: visit.patientId,
        doctorName: getDoctorName(visit.doctorId),
        department: visit.department,
        visitDate: visit.booking_date || visit.appointmentDate,
        startTime: visit.consulting_time,
        token: visit.token
      }
    });
  };

  const VisitDetailsModal = ({ visit, onClose }) => {
    if (!visit) return null;
    const doctorName = getDoctorName(visit.doctorId);
    const doctorImage = getDoctorImage(visit.doctorId);
    
    return (
      <Modal isOpen={showDetailsModal} onClose={onClose} title="Visit Details" size="lg">
        <div className="flex items-center gap-4 mb-6">
          <ShadcnAvatar className="w-12 h-12">
            <AvatarImage 
              src={getS3ImageUrl(visit.patient_image || visit.patientImage)} 
              alt={visit.patient_name || visit.patientName || 'Patient'}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-base font-medium">
              {(visit.patient_name || visit.patientName || 'P')?.charAt(0)?.toUpperCase() || "P"}
            </AvatarFallback>
          </ShadcnAvatar>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{visit.patient_name || visit.patientName}</h3>
            <p className="text-sm text-gray-500">Visit ID: {visit.id}</p>
            <p className="text-xs text-gray-400">Token: {visit.token || 'N/A'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Doctor Name</label>
            <div className="flex items-center gap-2 mt-1">
              <ShadcnAvatar className="w-6 h-6">
                <AvatarImage 
                  src={getS3ImageUrl(doctorImage)} 
                  alt={doctorName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                  {doctorName?.charAt(0)?.toUpperCase() || "D"}
                </AvatarFallback>
              </ShadcnAvatar>
              <p className="text-sm text-gray-800">Dr. {doctorName}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Department</label>
            <p className="text-sm text-gray-800">{visit.department || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Date & Time</label>
            <p className="text-sm text-gray-800">{formatDateTime(visit.booking_date || visit.appointmentDate, visit.consulting_time)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Token Number</label>
            <p className="text-sm font-mono font-bold text-blue-600">#{visit.token || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Patient Phone</label>
            <p className="text-sm text-gray-800">{visit.patient_phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Hospital ID</label>
            <p className="text-sm text-gray-800">{visit.hospitalId || 'N/A'}</p>
          </div>
        </div>
        {visit.reason && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500">Reason</label>
            <p className="text-sm text-gray-700 mt-1">{visit.reason}</p>
          </div>
        )}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} fullWidth>Close</Button>
          <Button 
            variant="success" 
            onClick={() => { handleStartVisit(visit); onClose(); }} 
            fullWidth 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <PlayCircle size={16} /> Start Visit
          </Button>
        </div>
      </Modal>
    );
  };

  // Row Action Menu
  const RowActionMenu = ({ visit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    
    useEffect(() => {
      const handleClickOutside = (e) => { 
        if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); 
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
      <div className="relative inline-block" ref={menuRef}>
        <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="p-2">
          <MoreVertical size={18} />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button 
              onClick={() => { handleStartVisit(visit); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-t-lg"
            >
              <PlayCircle size={16} /> Start Visit
            </button>
            <button 
              onClick={() => { handleViewDetails(visit); setShowMenu(false); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye size={16} /> View Details
            </button>
          </div>
        )}
      </div>
    );
  };

  const isLoadingData = isLoading || isLoadingDoctors;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Visits</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Visits</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Visits List</h1>
        <p className="text-sm text-gray-500 mt-1">Total Visits: {totalItems}</p>
      </div>

      {/* Search and Action Buttons Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by patient name, doctor, or token..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button className="absolute right-2 top-1.5 bg-gradient-to-r from-green-600 to-emerald-600 p-1 rounded">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button 
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('');
              setDateFilter('');
              setCurrentPage(1);
              refetch();
              showSuccessToast("Refreshed visits", 2000);
            }} 
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
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
        </div>
      </div>

      {/* FILTER SECTION */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => {
              setDepartmentFilter('');
              setDateFilter('');
              setSearchTerm('');
              showSuccessToast("All filters cleared", 2000);
            }} className="text-sm font-medium text-red-500 hover:text-red-600">
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)} 
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="General">General</option>
            </select>

            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0]" 
            />
          </div>
        </div>
      )}

      {/* Visits Table */}
      {allVisits.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Visits 
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Visit ID</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Token</th>
                  <th className="px-6 py-3 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allVisits.map((visit, index) => {
                  const doctorName = getDoctorName(visit.doctorId);
                  const doctorImage = getDoctorImage(visit.doctorId);
                  
                  return (
                    <tr key={visit.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-6 py-4 text-[#1C62A0] font-medium">
                        #{visit.id || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ShadcnAvatar className="w-8 h-8">
                            <AvatarImage 
                              src={getS3ImageUrl(visit.patient_image || visit.patientImage)} 
                              alt={visit.patient_name || visit.patientName || 'Patient'}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                              {(visit.patient_name || visit.patientName || 'P')?.charAt(0)?.toUpperCase() || "P"}
                            </AvatarFallback>
                          </ShadcnAvatar>
                          <div>
                            <span className="font-medium text-gray-800">
                              {visit.patient_name || visit.patientName || 'Patient'}
                            </span>
                            <p className="text-xs text-gray-400">ID: {visit.patientId || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShadcnAvatar className="w-6 h-6">
                            <AvatarImage 
                              src={getS3ImageUrl(doctorImage)} 
                              alt={doctorName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                              {doctorName?.charAt(0)?.toUpperCase() || "D"}
                            </AvatarFallback>
                          </ShadcnAvatar>
                          <span className="text-gray-600">Dr. {doctorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{visit.department || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDateTime(visit.booking_date || visit.appointmentDate, visit.consulting_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700">
                          #{visit.token || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RowActionMenu visit={visit} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="visits"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No visits match your search' : 'No accepted appointments found for this hospital'}
          </p>
        </div>
      )}

      {/* Visit Details Modal */}
      {showDetailsModal && selectedVisit && (
        <VisitDetailsModal visit={selectedVisit} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
};

export default HospitalVisitList;