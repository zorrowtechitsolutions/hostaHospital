// src/components/super-admin/RecentAppointments.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Hospital,
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  Filter,
  Search,
  ChevronDown,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Input, Pagination } from '../ui';
import CustomSelect from '../ui/CustomSelect';
import { useGetBookingsQuery } from '../../../app/service/request';
import { useGetAllHospitalsQuery } from '../../../app/service/hospitalApi';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';

// ✅ Static Status filter options
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ✅ Items per page options — string values matching String(itemsPerPage)
const ITEMS_PER_PAGE_OPTIONS = [
  { value: '6', label: '6' },
  { value: '9', label: '9' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' },
];

// Styling overrides
const FILTER_SELECT_CLASS =
  "min-w-[150px] [&>button]:border-gray-200 [&>button]:pl-4 [&>button]:pr-10 [&>button]:py-2 [&>button]:text-sm [&>button]:rounded-lg [&>button]:focus:ring-2 [&>button]:focus:ring-[#1C62A0] [&>button]:focus:border-transparent";

const ITEMS_PER_PAGE_SELECT_CLASS =
  "w-20 [&>button]:border-gray-200 [&>button]:pl-3 [&>button]:pr-8 [&>button]:py-2 [&>button]:text-sm [&>button]:rounded-lg [&>button]:focus:ring-2 [&>button]:focus:ring-[#1C62A0] [&>button]:focus:border-transparent";

const RecentAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const { data: doctorsData, isLoading: loadingDoctors } = useGetDoctorsQuery({
    skipHospitalFilter: true
  });
  const { data: appointmentsData, isLoading: loadingAppointments } = useGetBookingsQuery({
    skipHospitalFilter: true,
  });

  const hospitals = hospitalsData?.data || hospitalsData || [];

  // ✅ Options for the Hospital filter CustomSelect — string values for strict ===
  const hospitalFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Hospitals' },
      ...hospitals.map(h => ({
        value: String(h.id || h._id),
        label: h.name || h.hospitalName || 'Hospital',
      })),
    ],
    [hospitals]
  );

  const getRelativeTime = (date) => {
    if (!date) return 'Just now';

    const now = new Date();
    const created = new Date(date);

    if (Number.isNaN(created.getTime())) {
      return 'Recently';
    }

    const diffInSeconds = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diffInSeconds < 10) {
      return 'Just now';
    }

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) {
      return 'Yesterday';
    }

    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return created.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      requested: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
      approved: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-blue-100 text-blue-700',
      done: 'bg-blue-100 text-blue-700',
      declined: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      canceled: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'border-amber-200 bg-amber-50 text-amber-700',
      requested: 'border-amber-200 bg-amber-50 text-amber-700',
      accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      completed: 'border-blue-200 bg-blue-50 text-blue-700',
      done: 'border-blue-200 bg-blue-50 text-blue-700',
      declined: 'border-red-200 bg-red-50 text-red-700',
      rejected: 'border-red-200 bg-red-50 text-red-700',
      cancelled: 'border-gray-200 bg-gray-50 text-gray-700',
      canceled: 'border-gray-200 bg-gray-50 text-gray-700'
    };
    return colors[status] || 'border-gray-200 bg-gray-50 text-gray-700';
  };

  useEffect(() => {
    const loadData = async () => {
      if (loadingHospitals || loadingDoctors || loadingAppointments) {
        return;
      }

      const hospitals = hospitalsData?.data || hospitalsData || [];
      const doctors = doctorsData?.data?.rows || doctorsData?.data || doctorsData?.doctors || [];

      let appointmentsDataList = [];

      if (appointmentsData) {
        if (Array.isArray(appointmentsData)) {
          appointmentsDataList = appointmentsData;
        }
        else if (appointmentsData.data) {
          if (Array.isArray(appointmentsData.data)) {
            appointmentsDataList = appointmentsData.data;
          } else if (appointmentsData.data.rows && Array.isArray(appointmentsData.data.rows)) {
            appointmentsDataList = appointmentsData.data.rows;
          } else if (appointmentsData.data.bookings && Array.isArray(appointmentsData.data.bookings)) {
            appointmentsDataList = appointmentsData.data.bookings;
          } else if (typeof appointmentsData.data === 'object' && !Array.isArray(appointmentsData.data)) {
            for (const key in appointmentsData.data) {
              if (Array.isArray(appointmentsData.data[key]) && appointmentsData.data[key].length > 0) {
                appointmentsDataList = appointmentsData.data[key];
                break;
              }
            }
          }
        }
        else if (appointmentsData.bookings && Array.isArray(appointmentsData.bookings)) {
          appointmentsDataList = appointmentsData.bookings;
        }
        else if (appointmentsData.rows && Array.isArray(appointmentsData.rows)) {
          appointmentsDataList = appointmentsData.rows;
        } else {
          for (const key in appointmentsData) {
            if (Array.isArray(appointmentsData[key]) && appointmentsData[key].length > 0) {
              appointmentsDataList = appointmentsData[key];
              break;
            }
          }
        }
      }

      const processedAppointments = appointmentsDataList.map((appointment) => {
        const patientName =
          appointment.patient_name ||
          appointment.patientName ||
          appointment.patient?.name ||
          'Patient';

        const doctorName =
          appointment.displayName ||
          appointment.doctorName ||
          appointment.doctor_name ||
          appointment.doctor?.displayName ||
          'Doctor';

        const hospitalId =
          appointment.hospitalId ||
          appointment.hospital_id ||
          appointment.hospital?.id;

        const hospital = hospitals.find(
          (h) => String(h.id || h._id) === String(hospitalId)
        );

        const hospitalName =
          appointment.hospitalName ||
          appointment.hospital_name ||
          appointment.hospital?.name ||
          hospital?.name ||
          hospital?.hospitalName ||
          'Hospital';

        const status = (
          appointment.status ||
          appointment.booking_status ||
          appointment.bookingStatus ||
          'pending'
        ).toLowerCase();

        let action = 'requested appointment';

        if (
          status === 'accepted' ||
          status === 'confirmed' ||
          status === 'approve' ||
          status === 'approved'
        ) {
          action = 'confirmed appointment';
        } else if (
          status === 'completed' ||
          status === 'complete' ||
          status === 'done'
        ) {
          action = 'completed appointment';
        } else if (
          status === 'declined' ||
          status === 'rejected' ||
          status === 'decline' ||
          status === 'denied'
        ) {
          action = 'declined appointment';
        } else if (
          status === 'cancel' ||
          status === 'cancelled' ||
          status === 'canceled'
        ) {
          action = 'cancelled appointment';
        }

        const time = getRelativeTime(
          appointment.createdAt ||
          appointment.created_at ||
          appointment.requestedAt ||
          appointment.booking_date
        );

        return {
          id: appointment.id || appointment._id || Math.random().toString(),
          patientName,
          doctorName,
          hospitalName,
          hospitalId: hospitalId || appointment.hospitalId,
          action,
          time,
          statusLabel: status,
          createdAt: appointment.createdAt || appointment.created_at || appointment.booking_date
        };
      });

      processedAppointments.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setAppointments(processedAppointments);
      setFilteredAppointments(processedAppointments);
      setLoading(false);
      setCurrentPage(1);
    };

    loadData();
  }, [hospitalsData, doctorsData, appointmentsData, loadingHospitals, loadingDoctors, loadingAppointments]);

  // Apply filters
  useEffect(() => {
    let filtered = appointments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.patientName.toLowerCase().includes(term) ||
          app.doctorName.toLowerCase().includes(term) ||
          app.hospitalName.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.statusLabel === statusFilter);
    }

    if (hospitalFilter !== 'all') {
      // ✅ Fixed: compare as strings — app.hospitalId may be a number from the API
      filtered = filtered.filter((app) => String(app.hospitalId) === String(hospitalFilter));
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, hospitalFilter, appointments]);

  // Pagination calculations
  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAppointments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      document.getElementById('appointments-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1C62A0] border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} appointment{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setHospitalFilter('all');
              setCurrentPage(1);
            }}
          >
            <RefreshCw size={14} className="mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient, doctor, or hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                />
              </div>
            </div>

            {/* ✅ Replaced native  (Status) with CustomSelect */}
            <CustomSelect
              hideLabel
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(value) => setStatusFilter(value)}
              className={FILTER_SELECT_CLASS}
            />

            {/* ✅ Replaced native  (Hospital) with CustomSelect */}
            <CustomSelect
              hideLabel
              value={hospitalFilter}
              options={hospitalFilterOptions}
              onChange={(value) => setHospitalFilter(value)}
              className={FILTER_SELECT_CLASS}
            />

            {/* ✅ Replaced native  (Items per page) with CustomSelect */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Show:</span>
              <CustomSelect
                hideLabel
                value={String(itemsPerPage)}
                options={ITEMS_PER_PAGE_OPTIONS}
                onChange={(value) => handleItemsPerPageChange({ target: { value } })}
                className={ITEMS_PER_PAGE_SELECT_CLASS}
              />
            </div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || hospitalFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setHospitalFilter('all');
                  setCurrentPage(1);
                }}
                className="text-xs text-[#1C62A0] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Appointments List */}
      <div id="appointments-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.length > 0 ? (
          currentItems.map((appointment) => (
            <div
              key={appointment.id}
              className="p-5 rounded-xl border border-gray-200 hover:border-[#1C62A0] hover:shadow-lg transition-all duration-300 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">
                    {appointment.patientName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {appointment.action}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.statusLabel)}`}>
                  {appointment.statusLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <Stethoscope size={14} className="text-emerald-500" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {appointment.doctorName}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <Hospital size={14} className="text-blue-500" />
                </div>
                <span className="text-sm text-gray-600">
                  {appointment.hospitalName}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {appointment.time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <CalendarIcon size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-600">No appointments found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default RecentAppointments;