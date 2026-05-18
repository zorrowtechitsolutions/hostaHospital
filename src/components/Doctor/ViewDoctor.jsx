import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Badge, Loader } from "../ui";
import { 
  Mail, Phone, MapPin, Calendar, Building, GraduationCap, 
  DollarSign, IdCard, Briefcase, Users, Home, Video, 
  CheckCircle, XCircle, Clock, Sun, Moon 
} from "lucide-react";
import RequestTable from "../Requests/RequestTable";
import Appointments from "../Appointment/Appointment";
import { useGetDoctorsQuery } from "../../../app/service/doctorApi";

// Mock doctor data for when API is unavailable
const MOCK_DOCTOR = {
  id: 7,
  hospitalId: 27,
  firstName: "Michael",
  lastName: "Brown",
  displayName: "Dr. Michael Brown",
  userName: "drbrown",
  email: "brown@gmail.com",
  phone: "8714239987",
  specialist: "Cardiologist",
  department: "Cardiology",
  qualification: "MD, FACC",
  experience: "15+ years",
  fees: 350,
  about: "Experienced cardiologist specializing in heart disease prevention and treatment.",
  bookingOpen: true,
  image: "https://randomuser.me/api/portraits/men/32.jpg",
  address: {
    country: "USA",
    state: "California",
    district: "Los Angeles",
    place: "Beverly Hills",
    pincode: "90210"
  },
  knowLanguages: ["English", "Spanish"],
  consultingOne: [
    { day: "monday", opening_time: "09:00 AM", closing_time: "05:00 PM" },
    { day: "tuesday", opening_time: "09:00 AM", closing_time: "05:00 PM" },
    { day: "wednesday", opening_time: "09:00 AM", closing_time: "05:00 PM" },
    { day: "thursday", opening_time: "09:00 AM", closing_time: "05:00 PM" },
    { day: "friday", opening_time: "09:00 AM", closing_time: "05:00 PM" }
  ],
  consultingTwo: [
    { 
      day: "saturday", 
      morning_session: { open: "10:00 AM", close: "01:00 PM" },
      evening_session: { open: "02:00 PM", close: "05:00 PM" }
    }
  ]
};

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Clean the ID
  const doctorId = id ? id.replace(/[^0-9]/g, '') : '';
  
  const [useMockData, setUseMockData] = useState(false);
  
  const {
    data: doctorResponse,
    isLoading,
    error,
    refetch,
  } = useGetDoctorsQuery({ doctorId: doctorId }, {
    skip: useMockData // Skip API call if using mock data
  });
  
  console.log("=== VIEW DOCTOR DEBUG ===");
  console.log("Doctor ID:", doctorId);
  console.log("API Response:", doctorResponse);
  console.log("API Error:", error);
  console.log("Using Mock Data:", useMockData);
  
  // Extract doctor from API response or use mock data
  let doctor = null;
  if (!useMockData && doctorResponse?.data) {
    const doctors = doctorResponse.data || [];
    doctor = doctors.find(doc => String(doc.id) === String(doctorId));
  }
  
  // If API failed or doctor not found, use mock data
  useEffect(() => {
    if (error || (!doctor && !isLoading)) {
      console.log("API failed, switching to mock data");
      setUseMockData(true);
    }
  }, [error, doctor, isLoading]);
  
  // Use mock doctor if API fails
  if (useMockData && !doctor) {
    doctor = { ...MOCK_DOCTOR, id: parseInt(doctorId) || 7 };
  }
  
  console.log("Extracted doctor:", doctor);
  
  const [activeTab, setActiveTab] = useState("requests");

  // Loading state (only show if using API and loading)
  if (!useMockData && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader centered />
      </div>
    );
  }
  
  // Error state with option to use mock data
  if (error && !useMockData) {
    console.error("Error fetching doctor:", error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-red-500 mb-4">
              <XCircle size={48} className="mx-auto" />
            </div>
            <p className="text-lg font-medium text-gray-800">Error loading doctor data</p>
            <p className="text-sm text-gray-500 mt-2">
              {error?.data?.message || error?.message || "Service temporarily unavailable"}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => refetch()} className="px-4 py-2">
                Retry API
              </Button>
              <Button 
                onClick={() => setUseMockData(true)} 
                variant="outline"
                className="px-4 py-2"
              >
                Use Demo Data
              </Button>
              <Button 
                onClick={() => navigate('/doctors')} 
                variant="ghost"
                className="px-4 py-2"
              >
                Back to Doctors
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Doctor not found with ID: {doctorId}</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => setUseMockData(true)} className="px-4 py-2">
                Use Demo Data
              </Button>
              <Button onClick={() => navigate('/doctors')} variant="outline" className="px-4 py-2">
                Back to Doctors
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const doctorName = doctor?.displayName || `${doctor?.firstName} ${doctor?.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Mock Data Banner */}
        {useMockData && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm text-yellow-800">
                  Using demo data. API is currently unavailable.
                </span>
              </div>
              <Button 
                onClick={() => {
                  setUseMockData(false);
                  refetch();
                }} 
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Try API Again
              </Button>
            </div>
          </div>
        )}

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
              src={doctor?.image || MOCK_DOCTOR.image} 
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" 
              alt={doctorName}
              onError={(e) => e.target.src = MOCK_DOCTOR.image}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-800">{doctorName}</h2>
                <Badge variant="outline" className="text-xs">ID: DR{String(doctor?.id).padStart(5, "0")}</Badge>
                <Badge variant={doctor?.bookingOpen !== false ? "success" : "danger"} className="text-xs">
                  {doctor?.bookingOpen !== false ? "Bookings Open" : "Bookings Closed"}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-2">{doctor?.specialist || doctor?.department || "Cardiology"}</p>
              <p className="text-gray-500 text-sm mb-3">{doctor?.about || "No description available"}</p>
              <div className="flex items-center gap-4 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{doctor?.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{doctor?.email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("basic")}
                className={`py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "basic"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "schedule"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Schedule & Consulting
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "appointments"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "requests"
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Requests
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">First Name</span>
                      <span className="text-gray-800 font-medium">{doctor?.firstName || "Michael"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Last Name</span>
                      <span className="text-gray-800 font-medium">{doctor?.lastName || "Brown"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Display Name</span>
                      <span className="text-gray-800 font-medium">{doctorName}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Hospital ID</span>
                      <span className="text-gray-800">{doctor?.hospitalId || "HOS027"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Department</span>
                      <span className="text-gray-800 font-medium">{doctor?.department || "Cardiology"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Specialist</span>
                      <span className="text-gray-800 font-medium">{doctor?.specialist || "Cardiologist"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Qualification</span>
                      <span className="text-gray-800 font-medium">{doctor?.qualification || "MD, FACC"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Experience</span>
                      <span className="text-gray-800 font-medium text-green-600">{doctor?.experience || "15+ years"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Fees</span>
                      <span className="text-gray-800 font-medium text-green-600">
                        ${doctor?.fees || "350"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-800">{doctor?.email || "brown@gmail.com"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-800">{doctor?.phone || "8714239987"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Languages Known
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor?.knowLanguages && doctor.knowLanguages.length > 0 ? (
                      doctor.knowLanguages.map((lang, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">English</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    <Clock className="inline-block h-5 w-5 mr-2" />
                    Consulting Hours
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Monday - Friday</span>
                      <span className="text-gray-600">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Saturday</span>
                      <span className="text-gray-600">10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Sunday</span>
                      <span className="text-gray-600">Closed</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    <Video className="inline-block h-5 w-5 mr-2" />
                    Booking Status
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4" /> Bookings Open
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <Appointments 
                doctorId={doctor?.id}
                doctorName={doctorName}
              />
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <RequestTable 
                doctorId={doctor?.id}
                doctorName={doctorName}
                useMockData={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;