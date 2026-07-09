// src/components/super-admin/HospitalVisitList.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, User, Stethoscope, Phone, Loader2, CheckCircle, XCircle, Clock as ClockIcon, MapPin, Users as UsersIcon, Filter, RefreshCcw, Download, Upload, MoreVertical, Eye, Edit, Trash2, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, Badge, Modal } from '../../ui';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../ui/Toast';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getS3ImageUrl } from '../../../../app/service/S3';
import { socket } from '../../../socket/socket';
import { registerBookingEvents, unregisterBookingEvents } from '../../../socket/bookingEvents';

// ================= DATE FORMAT HELPER =================
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
        <span className="font-medium text-gray-700">{totalItems}</span> visits
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

// Helper functions for date formatting
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
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  const itemsPerPage = 12;

  const [eventsRegistered, setEventsRegistered] = useState(false);

  const { data: bookingsData, isLoading, refetch, isFetching } = useGetBookingsQuery({
    hospitalId: id,
    status: "accepted",
    page: currentPage,
    limit: itemsPerPage,
    search_query: searchTerm || undefined,
    ...(departmentFilter && { department: departmentFilter }),
    ...(dateFilter && { date: dateFilter })
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
      phone: doctor.phone,
      imageKey: doctor.imageKey || null
    });
  });

  const allVisits = bookingsData?.data || [];
  const totalItems = bookingsData?.pagination?.totalItems || allVisits.length;
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
        showWarningToast(`Booking cancelled!`, 3000);
        refetch();
      },
      onBookingAccepted: () => {
        showSuccessToast(`New visit added!`, 3000);
        refetch();
      },
      onBookingCompleted: () => {
        showSuccessToast(`Visit completed!`, 3000);
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
            showWarningToast(`Booking cancelled!`, 3000);
            refetch();
          },
          onBookingAccepted: () => {
            showSuccessToast(`New visit added!`, 3000);
            refetch();
          },
          onBookingCompleted: () => {
            showSuccessToast(`Visit completed!`, 3000);
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
  }, [searchTerm, departmentFilter, dateFilter]);

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
    setActiveMenu(null);
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
    setActiveMenu(null);
  };

  const toggleMenu = (visitId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === visitId ? null : visitId);
  };

  // Row Action Menu for Card
  const RowActionMenu = ({ visit }) => {
    const visitId = visit.id;

    return (
      <div className="relative inline-block menu-container" ref={menuRef}>
        <button 
          onClick={(e) => toggleMenu(visitId, e)} 
          className="p-1 rounded transition-colors hover:bg-gray-100"
        >
          <MoreVertical size={18} className="text-gray-600" />
        </button>
        {activeMenu === visitId && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            <button 
              onClick={() => { handleStartVisit(visit); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded-t-lg"
            >
              <PlayCircle size={16} /> Start Visit
            </button>
            <button 
              onClick={() => { handleViewDetails(visit); }} 
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
            >
              <Eye size={16} /> View Details
            </button>
          </div>
        )}
      </div>
    );
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
              <p className="text-sm text-gray-800">{doctorName}</p>
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

  const isLoadingData = isLoading || isLoadingDoctors;

  if (isLoadingData) {
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
                showFilters || activeFilterCount > 0 ? 'text-[#6366F1]' : 'text-gray-500'
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
        <h1 className="text-2xl font-bold text-gray-800">Visits List</h1>
        <p className="text-sm text-gray-500 mt-1">
          Total Visits: {totalItems}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search visits by patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent border border-gray-300 outline-none"
          />
        </div>
      </div>

      {/* FILTER SECTION */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            <button onClick={() => {
              setDepartmentFilter('');
              setDateFilter('');
              setSearchTerm('');
              showSuccessToast("All filters cleared", 2000);
            }} className="text-sm text-red-500 hover:text-red-600">
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)} 
              className="h-10 px-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#6366F1] bg-white text-sm"
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
              className="h-10 px-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#6366F1] text-sm" 
            />
          </div>
        </div>
      )}

      {allVisits.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allVisits.map((visit) => {
              const doctorName = getDoctorName(visit.doctorId);
              const doctorSpeciality = getDoctorSpeciality(visit.doctorId);
              
              return (
                <Card key={visit.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {visit.patient_name || visit.patientName || 'Patient'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Token: {visit.token || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Hospital ID: {visit.hospitalId}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle size={12} /> Confirmed
                      </Badge>
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
                    {visit.department && !doctorSpeciality && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{visit.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 my-2"></div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{formatDate(visit.booking_date || visit.appointmentDate) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock size={12} className="text-gray-400 flex-shrink-0" />
                      <span>{visit.consulting_time || 'N/A'}</span>
                    </div>
                    {visit.patient_phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{visit.patient_phone}</span>
                      </div>
                    )}
                  </div>

                  {visit.reason && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Reason:</span>
                        <p className="mt-0.5 line-clamp-2">{visit.reason}</p>
                      </div>
                    </>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button 
                      onClick={() => handleStartVisit(visit)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                    >
                      <PlayCircle size={14} /> Start Visit
                    </button>
                    <RowActionMenu visit={visit} />
                  </div>
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
            {searchTerm ? 'No visits match your search' : 'No visits found for this hospital'}
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