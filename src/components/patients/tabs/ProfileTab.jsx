import React from "react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  Calendar as CalendarIcon, 
  Clock as ClockIcon, 
  Droplet, 
  ChevronRight,
  Heart,
  Activity,
  Thermometer,
  Weight
} from "lucide-react";

const ProfileTab = ({ patient, handleEditPatient, handleAddAppointment, handleViewAppointmentDetails, handleViewVisitDetails, handleViewVitalDetails, setTab, getStatusBadge }) => {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={patient.image} className="w-16 h-16 rounded-lg object-cover" alt={patient.name} />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div><p className="text-sm text-gray-500">#{patient.id}</p><h3 className="font-semibold text-lg">{patient.name}</h3><p className="text-sm text-gray-500">Last Visited: {patient.lastVisit}</p></div>
              </div>
            </div>
          </div>
          <hr className="my-4" />
          <h3 className="font-semibold mb-3">Basic Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Added On</span><span>{patient.addedOn}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">DOB</span><span>{patient.dob} ({patient.age} years)</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gender</span><span>{patient.gender}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Marital Status</span><span>{patient.maritalStatus}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Blood Group</span><span className="flex items-center gap-1"><Droplet className="w-3 h-3 text-red-500" />{patient.blood}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Referred By</span><span>{patient.referredBy}</span></div>
          </div>
          <hr className="my-4" />
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{patient.phone}</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{patient.email}</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /><span>{patient.address}</span></div>
          </div>
          <hr className="my-4" />
          <div className="text-center"><div className="bg-blue-50 rounded-lg px-4 py-2"><p className="text-sm text-gray-500">Total Bookings</p><p className="text-2xl font-bold text-blue-600">+{patient.totalBookings}</p></div></div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-gray-800">Appointments</h3><button onClick={handleAddAppointment} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">View All <ChevronRight size={14} /></button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.appointments.map(apt => (
              <div key={apt.id} className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer" onClick={() => handleViewAppointmentDetails({...apt, patientName: patient.name, avatar: patient.image})}>
                <div className="flex justify-between items-start mb-2"><span className={`text-xs px-2 py-1 rounded ${apt.status === 'upcoming' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>{apt.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span><CalendarIcon size={14} className="text-gray-400" /></div>
                <div className="mt-2 text-sm space-y-1"><p><span className="text-gray-500">Department:</span> <span className="font-medium">{apt.department}</span></p><p><span className="text-gray-500">Doctor:</span> <span className="font-medium">{apt.doctor}</span></p><p><span className="text-gray-500">Date & Time:</span> {apt.date}, {apt.time}</p><p><span className="text-gray-500">Booked On:</span> {apt.bookedOn}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-gray-800">Vital Signs</h3><button className="text-red-500 text-sm hover:underline">Past Data</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => handleViewVitalDetails({ bloodPressure: patient.bloodPressure, heartRate: patient.heartRate, temperature: patient.temperature, spo2: patient.spo2, respiratoryRate: patient.respiratoryRate, weight: patient.weight })}><Droplet size={20} className="text-blue-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Blood Pressure</p><p className="font-semibold text-gray-800">{patient.bloodPressure} mmHg</p></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => handleViewVitalDetails({ bloodPressure: patient.bloodPressure, heartRate: patient.heartRate, temperature: patient.temperature, spo2: patient.spo2, respiratoryRate: patient.respiratoryRate, weight: patient.weight })}><Heart size={20} className="text-red-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Heart Rate</p><p className="font-semibold text-gray-800">{patient.heartRate} bpm</p></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><Activity size={20} className="text-green-500 mx-auto mb-1" /><p className="text-xs text-gray-500">SPO2</p><p className="font-semibold text-gray-800">{patient.spo2}%</p></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><Thermometer size={20} className="text-orange-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Temperature</p><p className="font-semibold text-gray-800">{patient.temperature}°F</p></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><Weight size={20} className="text-purple-500 mx-auto mb-1" /><p className="text-xs text-gray-500">Weight</p><p className="font-semibold text-gray-800">{patient.weight} kg</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-gray-800">Recent Visit History</h3><button onClick={() => setTab("visits")} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">View All <ChevronRight size={14} /></button></div>
          <div className="space-y-3">
            {patient.visitHistoryList.slice(0, 2).map((visit) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewVisitDetails(visit)}>
                <div className="flex justify-between items-start mb-2"><div><p className="font-semibold text-gray-800">{visit.doctorName}</p><p className="text-xs text-gray-500">{visit.department}</p></div><span className={getStatusBadge(visit.status)}>{visit.status}</span></div>
                <div className="grid grid-cols-2 gap-3 text-sm mt-2"><div className="flex items-center gap-2"><CalendarIcon size={14} className="text-gray-400" /><span className="text-gray-600">{visit.visitDate}</span></div><div className="flex items-center gap-2"><ClockIcon size={14} className="text-gray-400" /><span className="text-gray-600">{visit.startTime}</span></div></div>
                <p className="text-sm text-gray-600 mt-2"><span className="text-gray-500">Reason:</span> {visit.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;