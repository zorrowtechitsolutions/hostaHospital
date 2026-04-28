import React from "react";
import { Search, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Total Appointments
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
            {totalItems}
          </span>
        </h2>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="inprogress">Inprogress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Patient ID</th>
              <th className="px-6 py-3">Doctor Name</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Appointment Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAppointments.length > 0 ? (
              paginatedAppointments.map((apt, index) => (
                <tr 
                  key={apt.id} 
                  className="hover:bg-gray-50 border-b border-gray-100"
                >
                  <td 
                    className="px-6 py-4 text-[#1C62A0] font-medium cursor-pointer"
                    onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                  >
                    #{patient.id}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
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
                  </td>
                  <td 
                    className="px-6 py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                  >
                    {apt.department}
                  </td>
                  <td 
                    className="px-6 py-4 text-gray-600 cursor-pointer"
                    onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                  >
                    {apt.appointmentDate}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}
                  >
                    <span className={getStatusBadge(apt.status)}>{apt.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right relative action-menu-container">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenu(openMenu === `apt-${apt.id}` ? null : `apt-${apt.id}`);
                      }}
                      className="p-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>
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
                            handleDeleteClick('appointment', apt.id, startIndex + index, `Appointment with ${apt.doctorName} on ${apt.appointmentDate}`);
                            setOpenMenu(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {paginatedAppointments.length} of {totalItems} appointments
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded-md text-sm transition-all ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">
              {currentPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1 border rounded-md text-sm transition-all ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;