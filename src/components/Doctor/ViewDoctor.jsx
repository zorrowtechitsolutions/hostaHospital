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
import { useGetDoctorByIdQuery } from "../../../app/service/doctorApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Helper function to get S3 image URL
const getS3ImageUrl = (imageKey) => {
  if (!imageKey) return "";
  
  if (imageKey.startsWith("http")) {
    return imageKey;
  }
  
  const S3_BASE_URL = "https://hostahealthcare.s3.eu-north-1.amazonaws.com";
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
};

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Clean the ID
  const doctorId = id ? id.replace(/[^0-9]/g, '') : '';
  
  const [activeTab, setActiveTab] = useState("basic");
  
  // Use getDoctorById query for single doctor
  const {
    data: doctorResponse,
    isLoading,
    error,
    refetch,
  } = useGetDoctorByIdQuery(doctorId, {
    skip: !doctorId
  });
  
  console.log("=== VIEW DOCTOR DEBUG ===");
  console.log("Doctor ID:", doctorId);
  console.log("API Response:", doctorResponse);
  console.log("API Error:", error);
  
  // Extract doctor from response
  const doctor = doctorResponse?.data || doctorResponse?.doctor || doctorResponse;
  
  console.log("Extracted doctor:", doctor);
  
  // Get image key - prioritize imageUrl, then profileImage, then imageKey, then image
  const imageKey = doctor?.imageUrl || doctor?.profileImage || doctor?.imageKey || doctor?.image || null;
  console.log("🖼️ Image key:", imageKey);
  
  const doctorName = doctor?.displayName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || "Doctor";

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader centered text="Loading doctor details..." />
      </div>
    );
  }
  
  // Error state
  if (error) {
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
                Retry
              </Button>
              <Button 
                onClick={() => navigate('/doctors')} 
                variant="outline"
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
  
  // Doctor not found
  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Doctor not found with ID: {doctorId}</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => navigate('/doctors')} variant="outline" className="px-4 py-2">
                Back to Doctors
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to format consulting hours
  const getConsultingHours = () => {
    const hours = [];
    
    // Process consultingOne (single session days)
    if (doctor.consultingOne && Array.isArray(doctor.consultingOne)) {
      doctor.consultingOne.forEach(item => {
        hours.push({
          day: item.day,
          hours: `${item.opening_time || 'N/A'} - ${item.closing_time || 'N/A'}`,
          type: 'single'
        });
      });
    }
    
    // Process consultingTwo (split session days)
    if (doctor.consultingTwo && Array.isArray(doctor.consultingTwo)) {
      doctor.consultingTwo.forEach(item => {
        const morning = item.morning_session;
        const evening = item.evening_session;
        hours.push({
          day: item.day,
          hours: `${morning?.open || 'N/A'} - ${morning?.close || 'N/A'} & ${evening?.open || 'N/A'} - ${evening?.close || 'N/A'}`,
          type: 'split'
        });
      });
    }
    
    return hours;
  };

  const consultingHours = getConsultingHours();
  
  // Get day order for sorting
  const dayOrder = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
  const sortedHours = [...consultingHours].sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Doctor Details</h1>
          <Button variant="outline" onClick={() => navigate('/doctors')} className="text-sm">
            ← Back to Doctors
          </Button>
        </div>

        {/* Doctor Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={getS3ImageUrl(imageKey)} 
                alt={doctorName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-medium bg-gray-200">
                {doctor?.firstName?.[0]?.toUpperCase() || doctor?.displayName?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-800">{doctorName}</h2>
                <Badge variant="outline" className="text-xs">ID: DR{String(doctor?.id).padStart(4, '0')}</Badge>
                <Badge variant={doctor?.bookingOpen !== false ? "success" : "danger"} className="text-xs">
                  {doctor?.bookingOpen !== false ? "Bookings Open" : "Bookings Closed"}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-2">{doctor?.specialist || doctor?.department || "General Physician"}</p>
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
                      <span className="text-gray-800 font-medium">{doctor?.firstName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Last Name</span>
                      <span className="text-gray-800 font-medium">{doctor?.lastName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Display Name</span>
                      <span className="text-gray-800 font-medium">{doctorName}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Hospital ID</span>
                      <span className="text-gray-800">{doctor?.hospitalId || "N/A"}</span>
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
                      <span className="text-gray-800 font-medium">{doctor?.department || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Specialist</span>
                      <span className="text-gray-800 font-medium">{doctor?.specialist || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Qualification</span>
                      <span className="text-gray-800 font-medium">{doctor?.qualification || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Experience</span>
                      <span className="text-gray-800 font-medium">{doctor?.experience || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Fees</span>
                      <span className="text-gray-800 font-medium">${doctor?.fees || "0"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Registration Number</span>
                      <span className="text-gray-800 font-medium">{doctor?.regNo || doctor?.registrationNumber || "N/A"}</span>
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
                      <span className="text-gray-800">{doctor?.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-800">{doctor?.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {doctor?.address && Object.values(doctor.address).some(v => v) && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      Address
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Country</span>
                        <span className="text-gray-800">{doctor.address?.country || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">State</span>
                        <span className="text-gray-800">{doctor.address?.state || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">District</span>
                        <span className="text-gray-800">{doctor.address?.district || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Place</span>
                        <span className="text-gray-800">{doctor.address?.place || "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">Pincode</span>
                        <span className="text-gray-800">{doctor.address?.pincode || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

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
                      <span className="text-gray-500">No languages specified</span>
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
                  {sortedHours.length > 0 ? (
                    <div className="space-y-2">
                      {sortedHours.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700 capitalize">{item.day}</span>
                          <span className="text-gray-600">{item.hours}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No consulting hours configured
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    <Video className="inline-block h-5 w-5 mr-2" />
                    Booking Status
                  </h3>
                  <div className="flex items-center gap-3">
                    {doctor?.bookingOpen !== false ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4" /> Bookings Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        <XCircle className="h-4 w-4" /> Bookings Closed
                      </span>
                    )}
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;