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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm font-medium">Total Appointments <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">{totalItems}</span></div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-md overflow-hidden w-64 border border-gray-200">
            <input type="text" placeholder="Search Keyword" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1.5 text-sm w-full outline-none" />
            <button className="bg-[#1C62A0] px-3 py-1.5 text-white"><Search size={16} /></button>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white">
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="inprogress">Inprogress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Patient ID</th>
              <th className="p-3 text-left">Doctor Name</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Appointment Date</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedAppointments.length > 0 ? paginatedAppointments.map((apt, index) => (
              <tr key={apt.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}>
                <td className="p-3 text-gray-800">{patient.id}</td>
                <td className="p-3 text-gray-800">{apt.doctorName}</td>
                <td className="p-3 text-gray-600">{apt.department}</td>
                <td className="p-3 text-gray-600">{apt.appointmentDate}</td>
                <td className="p-3"><span className={getStatusBadge(apt.status)}>{apt.status}</span></td>
                <td className="p-3 text-right relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === `apt-${index}` ? null : `apt-${index}`); }} className="p-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"><MoreVertical size={16} /></button>
                  {openMenu === `apt-${index}` && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 action-menu-container">
                      <button onClick={(e) => { e.stopPropagation(); handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image}); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Eye size={15} /> View Details</button>
                      <button onClick={(e) => { e.stopPropagation(); handleEditAppointmentClick(apt); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><Edit size={15} /> Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('appointment', apt.id, startIndex + index, `Appointment with ${apt.doctorName} on ${apt.appointmentDate}`); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalItems > 0 && (
        <div className="px-4 py-3 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">Showing {paginatedAppointments.length} of {totalItems} appointments</div>
          <div className="flex gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`px-3 py-1 border rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}>Previous</button>
            <span className="px-3 py-1 bg-[#1C62A0] text-white rounded-md text-sm">{currentPage}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className={`px-3 py-1 border rounded-md text-sm ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;