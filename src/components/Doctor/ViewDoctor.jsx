// // src/components/Doctor/ViewDoctor.jsx - Refactored
// import { useParams, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { Button, Card, Badge, Loader } from "../ui";

// const ViewDoctor = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [doctor, setDoctor] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedDoctors = JSON.parse(localStorage.getItem("doctors")) || [];
//     const foundDoctor = savedDoctors.find(d => d.id === parseInt(id));
//     setDoctor(foundDoctor);
//     setLoading(false);
//   }, [id]);

//   if (loading) return <Loader centered />;
//   if (!doctor) return (
//     <div className="p-6 text-center">
//       <p className="text-gray-500">Doctor not found</p>
//       <Button variant="primary" onClick={() => navigate('/doctors')} className="mt-4">Back to Doctors</Button>
//     </div>
//   );

//   return (
//     <div className="p-6 bg-[#F8F9FA] min-h-screen">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-xl font-semibold text-gray-800">Doctor Details</h1>
//         <Button variant="ghost" onClick={() => navigate(-1)}>← Back to Doctors</Button>
//       </div>

//       <div className="grid grid-cols-12 gap-6">
//         {/* LEFT PANEL */}
//         <div className="col-span-4">
//           <Card className="p-5">
//             <div className="flex gap-4 items-center mb-4">
//               <img src={doctor.photo} className="w-16 h-16 rounded-lg object-cover" alt={doctor.name} />
//               <div>
//                 <Badge variant="info" className="text-xs">#DR{String(doctor.id).padStart(5, "0")}</Badge>
//                 <h2 className="font-semibold text-gray-800 mt-1">{doctor.name}</h2>
//                 <p className="text-sm text-gray-500">{doctor.specialty}</p>
//               </div>
//             </div>
//             <hr className="my-4 border-gray-100" />
//             <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
//             <div className="space-y-2 text-sm text-gray-600">
//               <p><strong>Specialist:</strong> {doctor.specialty}</p>
//               <p><strong>DOB:</strong> {doctor.dob || "-"}</p>
//               <p><strong>Gender:</strong> {doctor.gender || "-"}</p>
//               <p><strong>Experience:</strong> {doctor.experience}</p>
//               <p><strong>Phone:</strong> {doctor.phone}</p>
//               <p><strong>Email:</strong> {doctor.email}</p>
//               <p><strong>Registration:</strong> {doctor.registrationNumber || "-"}</p>
//               <p><strong>Appointments:</strong> {doctor.appointments}</p>
//             </div>
//             <hr className="my-4 border-gray-100" />
//             <h3 className="text-sm font-semibold text-gray-700 mb-2">Address Information</h3>
//             <p className="text-sm text-gray-600">{doctor.address}, {doctor.city}, {doctor.state}, {doctor.country}</p>
//           </Card>
//         </div>

//         {/* RIGHT PANEL */}
//         <div className="col-span-8 space-y-4">
//           <Card className="p-5">
//             <h3 className="font-semibold text-gray-800 mb-2">About</h3>
//             <p className="text-sm text-gray-600">{doctor.about || "No description available"}</p>
//           </Card>
//           <Card className="p-5"><h3 className="font-semibold text-gray-800">Education</h3></Card>
//           <Card className="p-5"><h3 className="font-semibold text-gray-800">Experience</h3></Card>
//           <Card className="p-5"><h3 className="font-semibold text-gray-800">Membership</h3></Card>
//           <Card className="p-5"><h3 className="font-semibold text-gray-800">Awards</h3></Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ViewDoctor;



// src/components/Doctor/ViewDoctor.jsx - Clean UI with Basic Info containing all details
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Card, Badge, Loader } from "../ui";
import { Mail, Phone, MapPin, Calendar, User, FileText, Clock, Stethoscope, DollarSign, CreditCard } from "lucide-react";
import RequestTable from "../Requests/RequestTable";
import Appointments from "../Appointment/Appointment";

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [allRequests, setAllRequests] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedDoctors = JSON.parse(localStorage.getItem("doctors")) || [];
    const foundDoctor = savedDoctors.find(d => d.id === parseInt(id));
    setDoctor(foundDoctor);
    
    const storedRequests = localStorage.getItem("requests");
    if (storedRequests) {
      setAllRequests(JSON.parse(storedRequests));
    } else {
      const defaultRequests = [
        { id: "REQ001", patientId: "PT0025", patientName: "James Carter", doctorId: 1, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDate: "2025-01-25", time: "11:00 AM", reason: "Gum pain", status: "pending", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
        { id: "REQ002", patientId: "PT0026", patientName: "Emily Rodriguez", doctorId: 1, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDate: "2025-01-28", time: "09:15 AM", reason: "Tooth sensitivity", status: "pending", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
        { id: "REQ003", patientId: "PT0027", patientName: "Michael Chen", doctorId: 2, doctorName: "Dr. Andrew Clark", department: "Cardiology", appointmentDate: "2025-01-30", time: "03:45 PM", reason: "Chest pain", status: "pending", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
        { id: "REQ004", patientId: "PT0028", patientName: "Lisa Wong", doctorId: 1, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDate: "2025-02-01", time: "01:00 PM", reason: "Root canal", status: "approved", avatar: "https://randomuser.me/api/portraits/women/55.jpg" },
        { id: "REQ005", patientId: "PT0029", patientName: "Sophia Martinez", doctorId: 3, doctorName: "Dr. Benjamin Harris", department: "Dermatology", appointmentDate: "2025-02-03", time: "11:30 AM", reason: "Skin rash", status: "pending", avatar: "https://randomuser.me/api/portraits/women/68.jpg" }
      ];
      setAllRequests(defaultRequests);
      localStorage.setItem("requests", JSON.stringify(defaultRequests));
    }
    
    const storedAppointments = localStorage.getItem("appointments");
    if (storedAppointments) {
      setAllAppointments(JSON.parse(storedAppointments));
    } else {
      const defaultAppointments = [
        { id: "APT001", patientId: "PT0025", patientName: "James Carter", doctorId: 2, doctorName: "Dr. Andrew Clark", department: "Cardiology", appointmentDateDisplay: "17 Jun 2025", startTime: "09:00 AM", status: "Upcoming", patientAvatar: "https://randomuser.me/api/portraits/men/32.jpg" },
        { id: "APT002", patientId: "PT0026", patientName: "Emily Rodriguez", doctorId: 1, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDateDisplay: "10 Jun 2025", startTime: "10:30 AM", status: "Completed", patientAvatar: "https://randomuser.me/api/portraits/women/44.jpg" },
        { id: "APT003", patientId: "PT0028", patientName: "Lisa Wong", doctorId: 1, doctorName: "Dr. Katherine Brooks", department: "Dental Surgery", appointmentDateDisplay: "22 May 2025", startTime: "01:15 PM", status: "Completed", patientAvatar: "https://randomuser.me/api/portraits/women/55.jpg" }
      ];
      setAllAppointments(defaultAppointments);
      localStorage.setItem("appointments", JSON.stringify(defaultAppointments));
    }
    
    setLoading(false);
  }, [id, refreshKey]);

  const handleApproveRequest = (request, appointmentData) => {
    const updatedRequests = allRequests.map(req => 
      req.id === request.id ? { ...req, status: "approved" } : req
    );
    setAllRequests(updatedRequests);
    localStorage.setItem("requests", JSON.stringify(updatedRequests));
    
    const newAppointment = {
      id: `APT${String(allAppointments.length + 1).padStart(3, '0')}`,
      patientId: request.patientId,
      patientName: request.patientName,
      doctorId: doctor?.id,
      doctorName: doctor?.name,
      department: request.department,
      appointmentDate: appointmentData.date,
      appointmentDateDisplay: new Date(appointmentData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      startTime: appointmentData.time,
      endTime: `${parseInt(appointmentData.time) + 1}:00 ${appointmentData.time.includes('PM') ? 'PM' : 'AM'}`,
      status: "Upcoming",
      fee: "$350",
      reason: request.reason,
      notes: "Approved request",
      patientAvatar: request.avatar
    };
    
    const updatedAppointments = [...allAppointments, newAppointment];
    setAllAppointments(updatedAppointments);
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    
    alert(`Request approved! Appointment created.`);
    setRefreshKey(prev => prev + 1);
  };

  const handleRejectRequest = (request, reason) => {
    const updatedRequests = allRequests.map(req => 
      req.id === request.id ? { ...req, status: "rejected", rejectionReason: reason } : req
    );
    setAllRequests(updatedRequests);
    localStorage.setItem("requests", JSON.stringify(updatedRequests));
    alert(`Request rejected.`);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) return <Loader centered />;
  if (!doctor) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Doctor not found</p>
      <Button onClick={() => navigate('/doctors')} className="mt-4">Back to Doctors</Button>
    </div>
  );

  const doctorRequestsCount = allRequests.filter(req => req.doctorId === doctor.id || req.doctorName === doctor.name).length;
  const doctorAppointmentsCount = allAppointments.filter(apt => apt.doctorId === doctor.id || apt.doctorName === doctor.name).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Doctor Details</h1>
          <Button variant="outline" onClick={() => navigate(-1)} className="text-sm">
            ← Back to Doctors
          </Button>
        </div>

        {/* Doctor Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <img 
              src={doctor.photo || "https://randomuser.me/api/portraits/women/68.jpg"} 
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" 
              alt={doctor.name} 
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-800">{doctor.name}</h2>
                <Badge variant="outline" className="text-xs">ID: DR{String(doctor.id).padStart(5, "0")}</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-2">{doctor.specialty}</p>
              <p className="text-gray-500 text-sm mb-3">{doctor.about || "Specialized in periodontics"}</p>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Phone size={14} />
                <span>{doctor.phone}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{doctorAppointmentsCount}</p>
                <p className="text-xs text-gray-500">Appointments</p>
              </div>
              <div className="text-center px-4 py-2 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{doctorRequestsCount}</p>
                <p className="text-xs text-gray-500">Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("basic")}
                className={`py-3 text-sm font-medium transition-colors ${
                  activeTab === "basic"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`py-3 text-sm font-medium transition-colors ${
                  activeTab === "appointments"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Appointments ({doctorAppointmentsCount})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-3 text-sm font-medium transition-colors ${
                  activeTab === "requests"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Requests ({doctorRequestsCount})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Specialist</span>
                      <span className="text-gray-800 font-medium">{doctor.specialty}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="text-gray-800">{doctor.dob || "-"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Gender</span>
                      <span className="text-gray-800">{doctor.gender || "-"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Experience</span>
                      <span className="text-gray-800 font-medium text-green-600">{doctor.experience}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Registration No.</span>
                      <span className="text-gray-800 font-mono">{doctor.registrationNumber || "REG12346"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-800">{doctor.email}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone size={16} className="text-gray-400" />
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail size={16} className="text-gray-400" />
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-700">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <span>{doctor.address}, {doctor.city}, {doctor.state}, {doctor.country}</span>
                    </div>
                  </div>
                </div>

                {/* Salary Information Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Salary Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Base Salary</span>
                      <span className="text-gray-800">$120,000 / year</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Bonus</span>
                      <span className="text-gray-800">$15,000 / year</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Total Compensation</span>
                      <span className="text-gray-800 font-semibold text-green-600">$135,000 / year</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="text-gray-800">Bank Transfer</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Account Number</span>
                      <span className="text-gray-800">****1234</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Bank Name</span>
                      <span className="text-gray-800">Chase Bank</span>
                    </div>
                  </div>
                </div>

                {/* Education Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Education
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-800">Medical School</p>
                      <p className="text-gray-600 text-sm">Harvard Medical School, Boston, MA</p>
                      <p className="text-gray-400 text-xs">1994 - 1998</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Residency</p>
                      <p className="text-gray-600 text-sm">Massachusetts General Hospital, Boston, MA</p>
                      <p className="text-gray-400 text-xs">1998 - 2002</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Fellowship</p>
                      <p className="text-gray-600 text-sm">Periodontics, University of Pennsylvania</p>
                      <p className="text-gray-400 text-xs">2002 - 2004</p>
                    </div>
                  </div>
                </div>

                {/* Certifications Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Certifications & Awards
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700 text-sm">✓ Board Certified in Periodontics</p>
                    <p className="text-gray-700 text-sm">✓ American Academy of Periodontology Member</p>
                    <p className="text-gray-700 text-sm">✓ Excellence in Research Award 2020</p>
                    <p className="text-gray-700 text-sm">✓ Top Periodontist of the Year 2022</p>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <Appointments 
                doctorId={doctor.id}
                doctorName={doctor.name}
              />
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <RequestTable 
                data={allRequests}
                doctorId={doctor.id}
                doctorName={doctor.name}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;