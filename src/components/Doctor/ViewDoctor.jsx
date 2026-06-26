// src/components/Doctor/ViewDoctor.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button, Badge, Loader } from "../ui";
import {
  Mail,
  Phone,
  Video,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  MapPin,
  Calendar as CalendarIcon,
  Building,
  Briefcase,
  GraduationCap,
  DollarSign,
  Users,
  Calendar,
  User as UserIcon,
  IdCard,
  Languages,
  Star // Added for reviews
} from "lucide-react";
import RequestTable from "../Requests/RequestTable";
import Appointments from "../Appointment/Appointment";
import ReviewTable from "../Doctor/ReviewTable"; // Import ReviewTable
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

// ==================== CONSTANTS ====================
const TABS = [
  { id: "basic", label: "Basic Information" },
  { id: "schedule", label: "Schedule & Consulting" },
  { id: "appointments", label: "Appointments" },
  { id: "requests", label: "Requests" },
  { id: "reviews", label: "Reviews" } // Added Reviews tab
];

const GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 gap-4";
const CARD_CLASS = "bg-white rounded-lg border border-gray-200";

const DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

// ==================== HELPER FUNCTIONS ====================
const getValue = (value, fallback = "N/A") => value || fallback;
const isBookingOpen = (doctor) => doctor?.bookingOpen !== false;

const getDoctorName = (doctor) =>
  doctor?.displayName ||
  `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() ||
  "Doctor";

const hasAddress = (address) =>
  address && Object.values(address).some(Boolean);

// Format time from 24h to 12h format
const formatTime = (time) => {
  if (!time || time === 'N/A') return 'N/A';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Format day name to display
const formatDay = (day) => {
  if (!day) return '';
  return day.charAt(0).toUpperCase() + day.slice(1);
};

// ==================== REUSABLE COMPONENTS ====================
const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
    {Icon && <Icon className="h-5 w-5 text-blue-500" />}
    {title}
  </h3>
);

const EmptyState = ({ text, icon: Icon }) => (
  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
    {Icon && <Icon className="h-8 w-8 mx-auto mb-2 text-gray-300" />}
    {text}
  </div>
);

const SmallBadge = ({ children, variant = "outline" }) => (
  <Badge variant={variant} className="text-xs">
    {children}
  </Badge>
);

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-500 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      {label}
    </span>
    <span className="text-gray-800 font-medium">{getValue(value)}</span>
  </div>
);

const InfoCard = ({ title, children, icon: Icon }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-blue-500" />}
      {title}
    </h4>
    {children}
  </div>
);

// Rating Display Component for Doctor Header
const RatingDisplay = ({ rating, totalReviews }) => {
  if (!rating && rating !== 0) return null;
  
  const renderStars = () => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
      {renderStars()}
      <span className="text-sm font-medium text-gray-700 ml-1">
        {rating.toFixed(1)}
      </span>
      {totalReviews > 0 && (
        <span className="text-xs text-gray-500 ml-1">
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

const ViewDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Clean the ID
  const doctorId = id ? id.replace(/[^0-9]/g, '') : '';
  
  const [activeTab, setActiveTab] = useState("basic");
  
  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  // Use getDoctorById query for single doctor
  const {
    data: doctorResponse,
    isLoading,
    error,
    refetch,
  } = useGetDoctorByIdQuery(doctorId, {
    skip: !doctorId
  });
  
  // Extract doctor from response
  const doctor = doctorResponse?.data || doctorResponse?.doctor || doctorResponse;
  
  // Get image key
  const imageKey = doctor?.imageUrl || doctor?.profileImage || doctor?.imageKey || doctor?.image || null;
  
  // Get doctor name
  const doctorName = getDoctorName(doctor);

  // Helper to format consulting hours - memoized
  const consultingHours = useMemo(() => {
    const hours = [];
    
    // Process consultingOne (single session days)
    if (doctor?.consultingOne && Array.isArray(doctor.consultingOne)) {
      doctor.consultingOne.forEach(item => {
        hours.push({
          day: item.day,
          morningOpen: item.opening_time,
          morningClose: item.closing_time,
          hasBreak: false
        });
      });
    }
    
    // Process consultingTwo (split session days)
    if (doctor?.consultingTwo && Array.isArray(doctor.consultingTwo)) {
      doctor.consultingTwo.forEach(item => {
        const morning = item.morning_session;
        const evening = item.evening_session;
        hours.push({
          day: item.day,
          morningOpen: morning?.open,
          morningClose: morning?.close,
          eveningOpen: evening?.open,
          eveningClose: evening?.close,
          hasBreak: true
        });
      });
    }
    
    return hours;
  }, [doctor]);

  const sortedHours = [...consultingHours].sort(
    (a, b) => (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99)
  );

  // Get Out Door Consulting data
  const outDoorConsulting = doctor?.outDoorConsulting;
  const hasOutDoorConsulting = outDoorConsulting?.time?.open && 
                                outDoorConsulting?.time?.close && 
                                outDoorConsulting?.place;

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
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className={`${CARD_CLASS} p-12 text-center`}>
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
          <div className={`${CARD_CLASS} p-12 text-center`}>
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
        <div className={`${CARD_CLASS} p-6 mb-6`}>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-24 h-24">
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
                <SmallBadge>ID: DR{String(doctor?.id).padStart(4, '0')}</SmallBadge>
                <SmallBadge variant={isBookingOpen(doctor) ? "success" : "danger"}>
                  {isBookingOpen(doctor) ? "Bookings Open" : "Bookings Closed"}
                </SmallBadge>
              </div>
              
              {/* DEPARTMENT - Display prominently */}
              <div className="mb-2">
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Department:</span>
                  <span className="text-gray-800 font-semibold">{getValue(doctor?.department)}</span>
                </p>
              </div>
              
              {/* Specialist - Secondary info */}
              {doctor?.specialist && doctor?.specialist !== doctor?.department && (
                <p className="text-gray-500 text-sm flex items-center gap-2 mb-2">
                  <IdCard className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Specialist:</span>
                  <span>{doctor?.specialist}</span>
                </p>
              )}
              
              <p className="text-gray-500 text-sm mb-3">{getValue(doctor?.about, "No description available")}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{getValue(doctor?.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>{getValue(doctor?.email)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={CARD_CLASS}>
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <SectionTitle icon={UserIcon} title="Personal Information" />
                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className={GRID_CLASS}>
                      <DetailRow label="First Name" value={doctor?.firstName} icon={UserIcon} />
                      <DetailRow label="Last Name" value={doctor?.lastName} icon={UserIcon} />
                      <DetailRow label="Display Name" value={doctorName} icon={UserIcon} />
                      <DetailRow label="Date of Birth" value={doctor?.dob ? new Date(doctor.dob).toLocaleDateString() : 'N/A'} icon={CalendarIcon} />
                      <DetailRow label="Gender" value={doctor?.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : 'N/A'} icon={UserIcon} />
                      <DetailRow label="Joining Date" value={doctor?.joiningDate ? new Date(doctor.joiningDate).toLocaleDateString() : 'N/A'} icon={CalendarIcon} />
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div>
                  <SectionTitle icon={Briefcase} title="Professional Details" />
                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className={GRID_CLASS}>
                      <DetailRow label="Department" value={doctor?.department} icon={Briefcase} />
                      <DetailRow label="Specialist" value={doctor?.specialist} icon={IdCard} />
                      <DetailRow label="Qualification" value={doctor?.qualification} icon={GraduationCap} />
                      <DetailRow label="Registration Number" value={doctor?.regNo || doctor?.registrationNumber} icon={IdCard} />
                      <DetailRow label="Experience" value={`${doctor?.experience || 'N/A'} years`} icon={Calendar} />
                      <DetailRow label="Fees" value={`₹${doctor?.fees || '0'}`} icon={DollarSign} />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <SectionTitle icon={Phone} title="Contact Information" />
                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className={GRID_CLASS}>
                      <DetailRow label="Email" value={doctor?.email} icon={Mail} />
                      <DetailRow label="Phone" value={doctor?.phone} icon={Phone} />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {hasAddress(doctor?.address) && (
                  <div>
                    <SectionTitle icon={MapPin} title="Address Information" />
                    <div className="bg-white rounded-lg border border-gray-100 p-4">
                      <div className={GRID_CLASS}>
                        <DetailRow label="Country" value={doctor?.address?.country} icon={MapPin} />
                        <DetailRow label="State" value={doctor?.address?.state} icon={MapPin} />
                        <DetailRow label="District" value={doctor?.address?.district} icon={MapPin} />
                        <DetailRow label="Place" value={doctor?.address?.place} icon={MapPin} />
                        <DetailRow label="Pincode" value={doctor?.address?.pincode} icon={MapPin} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Languages Known */}
                <div>
                  <SectionTitle icon={Languages} title="Languages Known" />
                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex flex-wrap gap-2">
                      {doctor?.knowLanguages && doctor.knowLanguages.length > 0 ? (
                        doctor.knowLanguages.map((lang, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {lang}
                          </span>
                        ))
                      ) : (
                        <EmptyState text="No languages specified" />
                      )}
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {doctor?.about && (
                  <div>
                    <SectionTitle icon={UserIcon} title="About" />
                    <div className="bg-white rounded-lg border border-gray-100 p-4">
                      <p className="text-gray-700 leading-relaxed">{doctor?.about}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                {/* Consulting Hours Section */}
                <div>
                  <SectionTitle icon={Clock} title="Consulting Hours" />
                  {sortedHours.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                      {sortedHours.map((item, index) => (
                        <div 
                          key={index} 
                          className={`flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-4 ${
                            index !== sortedHours.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2 sm:mb-0">
                            <CalendarIcon className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-gray-800 capitalize min-w-[100px]">
                              {formatDay(item.day)}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {item.hasBreak ? (
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
                                  {formatTime(item.morningOpen)} - {formatTime(item.morningClose)}
                                </span>
                                <span className="text-gray-400">&</span>
                                <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
                                  {formatTime(item.eveningOpen)} - {formatTime(item.eveningClose)}
                                </span>
                              </div>
                            ) : (
                              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {formatTime(item.morningOpen)} - {formatTime(item.morningClose)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No consulting hours configured" icon={Clock} />
                  )}
                </div>

                {/* Out Door Consulting Section */}
                <div>
                  <SectionTitle icon={Building} title="Out Door Consulting" />
                  {hasOutDoorConsulting ? (
                    <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Consulting Time
                          </p>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Open Time:</span>
                              <span className="font-medium text-gray-800">{formatTime(outDoorConsulting.time.open)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-gray-500">Close Time:</span>
                              <span className="font-medium text-gray-800">{formatTime(outDoorConsulting.time.close)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Consulting Place
                          </p>
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-gray-700 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {outDoorConsulting.place}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState text="No out door consulting configured" icon={Building} />
                  )}
                </div>

                {/* Booking Status Section */}
                <div>
                  <SectionTitle icon={Video} title="Booking Status" />
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Booking Availability</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Allow patients to book appointments with this doctor
                        </p>
                      </div>
                      {isBookingOpen(doctor) ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200 w-fit">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Bookings Open</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200 w-fit">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Bookings Closed</span>
                        </div>
                      )}
                    </div>
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

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <ReviewTable 
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