// src/components/patients/tabs/AppointmentsTab.jsx - Fixed to show Appointment ID instead of Patient ID
import React from "react";
import { Search, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Button, Input, Select, Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Badge, Pagination, SearchBar } from "../../ui";

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
  setOpenMenu 
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Appointments
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalItems}</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
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
                            handleEditAppointmentClick(apt);
                            setOpenMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit size={15} /> Edit
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
        <div className="px-6 py-3 border-t bg-gray-50">
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
  );
};

export default AppointmentsTab;