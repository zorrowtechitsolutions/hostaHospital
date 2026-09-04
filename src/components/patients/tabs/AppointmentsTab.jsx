// src/components/patients/tabs/AppointmentsTab.jsx - Fixed to show Appointment ID instead of Patient ID
import React from "react";
import { Calendar, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Button, Input, Select, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Badge, Pagination, SearchBar } from "../../ui";

// ============ SKELETON LOADING COMPONENTS ============

const SkeletonText = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}></div>
);

const SkeletonRow = () => (
  <TableRow>
    <TableCell>
      <SkeletonText width="w-20" height="h-3" />
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse"></div>
        <SkeletonText width="w-28" height="h-3" />
      </div>
    </TableCell>
    <TableCell>
      <SkeletonText width="w-24" height="h-3" />
    </TableCell>
    <TableCell>
      <SkeletonText width="w-28" height="h-3" />
    </TableCell>
    <TableCell>
      <SkeletonText width="w-16" height="h-5" className="rounded-full" />
    </TableCell>
    <TableCell className="text-right">
      <SkeletonText width="w-8" height="h-4" className="ml-auto" />
    </TableCell>
  </TableRow>
);

const AppointmentsSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
    <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
      <div className="flex items-center gap-2">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonText width="w-8" height="h-5" className="rounded-full" />
      </div>
    </div>

    <div className="flex flex-col min-h-[420px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <TableHeader>
                <SkeletonText width="w-20" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-20" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-20" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-24" height="h-3" />
              </TableHeader>
              <TableHeader>
                <SkeletonText width="w-12" height="h-3" />
              </TableHeader>
              <TableHeader className="text-right"></TableHeader>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto px-6 py-3 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <SkeletonText width="w-32" height="h-3" />
          <div className="flex gap-2">
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
            <SkeletonText width="w-8" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============ END SKELETON LOADING COMPONENTS ============

const AppointmentsTab = ({ 
  patient, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  currentPage, 
  totalPages, 
  paginatedAppointments, 
  filteredAppointments, 
  handlePageChange, 
  handleViewAppointmentDetails, 
  handleEditAppointmentClick, 
  handleDeleteClick, 
  getStatusBadge, 
  startIndex, 
  openMenu, 
  setOpenMenu,
  isLoading = false // New prop for loading state
}) => {
  const totalItems = filteredAppointments.length;

  // Helper function to format appointment ID
  const formatAppointmentId = (id) => {
    if (!id) return '#APT0000';
    let numericId;
    if (typeof id === 'string') {
      const match = id.match(/\d+/);
      numericId = match ? parseInt(match[0]) : parseInt(id) || 0;
    } else {
      numericId = parseInt(id) || 0;
    }
    return `#APT${String(numericId).padStart(4, '0')}`;
  };

  // Get badge variant based on status
  const getBadgeVariant = (status) => {
    const statusMap = {
      'accepted': 'success',
      'pending': 'warning',
      'completed': 'info',
      'cancelled': 'danger',
      'declined': 'danger',
      'rejected': 'danger'
    };
    return statusMap[status?.toLowerCase()] || 'default';
  };

  // Get display text for status
  const getStatusText = (status) => {
    const statusMap = {
      'accepted': 'Accepted',
      'pending': 'Pending',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'declined': 'Declined',
      'rejected': 'Rejected'
    };
    return statusMap[status?.toLowerCase()] || status || 'Pending';
  };

  // ============ SKELETON LOADING STATE ============
  if (isLoading) {
    return <AppointmentsSkeleton />;
  }
  // ============ END SKELETON LOADING STATE ============

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Appointments
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
        </h2>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">No appointments found</p>
          <p className="text-sm text-gray-400 mt-1">Appointments will appear here when scheduled</p>
        </div>
      ) : (
        <div className="flex flex-col min-h-[420px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                <tr>
                  <TableHeader>Appointment ID</TableHeader>
                  <TableHeader>Doctor Name</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Appointment Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right"></TableHeader>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? (
                  paginatedAppointments.map((apt, index) => (
                    <TableRow key={apt.id} hover>
                      <TableCell 
                        className="text-[#1C62A0] font-medium cursor-pointer"
                        onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                      >
                        {formatAppointmentId(apt.id)}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {apt.doctorName?.charAt(0) || 'D'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{apt.doctorName}</span>
                        </div>
                      </TableCell>
                      <TableCell 
                        className="text-gray-600 cursor-pointer"
                        onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                      >
                        {apt.department}
                      </TableCell>
                      <TableCell 
                        className="text-gray-600 cursor-pointer"
                        onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                      >
                        {apt.date || apt.appointmentDate}
                      </TableCell>
                      <TableCell 
                        className="cursor-pointer"
                        onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                      >
                        <Badge variant={getBadgeVariant(apt.status)}>
                          {getStatusText(apt.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right relative action-menu-container">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenu(openMenu === `apt-${apt.id}` ? null : `apt-${apt.id}`);
                          }}
                          className="p-2"
                        >
                          <MoreVertical size={16} className="text-gray-500" />
                        </Button>
                        {openMenu === `apt-${apt.id}` && (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image});
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={15} /> View Details
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteClick('appointment', apt.id, startIndex + index, `Appointment with ${apt.doctorName} on ${apt.date || apt.appointmentDate}`);
                                setOpenMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                      No appointments found
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </table>
          </div>

          {/* REPLACED INLINE PAGINATION WITH REUSABLE COMPONENT */}
          {totalItems > 0 && totalPages > 1 && (
            <div className="mt-auto px-6 py-3 border-t bg-gray-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={10}
                itemLabel="appointments"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;