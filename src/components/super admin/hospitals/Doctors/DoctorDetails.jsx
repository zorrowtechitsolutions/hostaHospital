// src/components/super-admin/DoctorDetails.jsx
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  IdCard,
  User as UserIcon,
  Languages,
  Building,
  Loader2,
  Calendar as CalendarIcon,
  FileText
} from 'lucide-react';
import { Card, Button, Badge } from '../../../ui';
import { useGetDoctorByIdQuery } from '../../../../../app/service/doctorApi';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Appointments from '../../../Appointment/Appointment';
import RequestTable from '../../../Requests/RequestTable';

// Helper function to get S3 image URL
const getS3ImageUrl = (imageKey) => {
  if (!imageKey) return "";
  if (imageKey.startsWith("http")) return imageKey;
  const S3_BASE_URL = "https://hostahealthcare.s3.eu-north-1.amazonaws.com";
  return `${S3_BASE_URL}/${encodeURIComponent(imageKey)}`;
};

// Helper functions
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

const formatDay = (day) => {
  if (!day) return '';
  return day.charAt(0).toUpperCase() + day.slice(1);
};

const DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');

  const {
    data: doctorResponse,
    isLoading,
    error,
  } = useGetDoctorByIdQuery(id, {
    skip: !id
  });

  const doctor = doctorResponse?.data || doctorResponse?.doctor || doctorResponse;
  const doctorName = getDoctorName(doctor);
  const imageKey = doctor?.imageUrl || doctor?.profileImage || doctor?.imageKey || doctor?.image || null;

  // Format consulting hours
  const consultingHours = useMemo(() => {
    const hours = [];
    
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

  const outDoorConsulting = doctor?.outDoorConsulting;
  const hasOutDoorConsulting = outDoorConsulting?.time?.open && 
                                outDoorConsulting?.time?.close && 
                                outDoorConsulting?.place;

  const tabs = [
    { id: 'details', label: 'Doctor Details' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'requests', label: 'Requests' }
  ];

  // Helper function to render tab icon
  const getTabIcon = (tabId) => {
    switch(tabId) {
      case 'details':
        return <Stethoscope size={16} className="mr-2" />;
      case 'appointments':
        return <CalendarIcon size={16} className="mr-2" />;
      case 'requests':
        return <FileText size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="text-center py-12">
        <Stethoscope size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Doctor not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back
        </Button>
      </div>

      {/* Doctor Profile Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage 
              src={getS3ImageUrl(imageKey)} 
              alt={doctorName}
              className="object-cover"
            />
            <AvatarFallback className="text-3xl font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              {doctor?.firstName?.[0]?.toUpperCase() || doctorName?.[0]?.toUpperCase() || "D"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{doctorName}</h1>
              <Badge variant="outline">ID: {doctor?.id}</Badge>
              <Badge variant={isBookingOpen(doctor) ? "success" : "danger"}>
                {isBookingOpen(doctor) ? "Bookings Open" : "Bookings Closed"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase size={16} className="text-blue-500" />
                <span className="font-medium">Department:</span>
                <span>{getValue(doctor?.department)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <IdCard size={16} className="text-blue-500" />
                <span className="font-medium">Specialist:</span>
                <span>{getValue(doctor?.specialist)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{getValue(doctor?.phone)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{getValue(doctor?.email)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#154A7D] text-[#154A7D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <>
            {/* Professional Details */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-blue-500" />
                Professional Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Qualification</span>
                  <span className="font-medium">{getValue(doctor?.qualification)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Registration Number</span>
                  <span className="font-medium">{getValue(doctor?.regNo || doctor?.registrationNumber)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium">{doctor?.experience ? `${doctor.experience} years` : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Consultation Fee</span>
                  <span className="font-medium text-green-600">₹{doctor?.fees || '0'}</span>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-500" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">First Name</span>
                  <span className="font-medium">{getValue(doctor?.firstName)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Last Name</span>
                  <span className="font-medium">{getValue(doctor?.lastName)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Gender</span>
                  <span className="font-medium">{getValue(doctor?.gender)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Date of Birth</span>
                  <span className="font-medium">{doctor?.dob ? new Date(doctor.dob).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Joining Date</span>
                  <span className="font-medium">{doctor?.joiningDate ? new Date(doctor.joiningDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </Card>

            {/* Address Information */}
            {hasAddress(doctor?.address) && (
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-500" />
                  Address Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Country</span>
                    <span className="font-medium">{getValue(doctor?.address?.country)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">State</span>
                    <span className="font-medium">{getValue(doctor?.address?.state)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">District</span>
                    <span className="font-medium">{getValue(doctor?.address?.district)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Place/City</span>
                    <span className="font-medium">{getValue(doctor?.address?.place)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Pincode</span>
                    <span className="font-medium">{getValue(doctor?.address?.pincode)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Languages Known */}
            {doctor?.knowLanguages && doctor.knowLanguages.length > 0 && (
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Languages size={20} className="text-blue-500" />
                  Languages Known
                </h2>
                <div className="flex flex-wrap gap-2">
                  {doctor.knowLanguages.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Consulting Hours */}
            {sortedHours.length > 0 && (
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  Consulting Hours
                </h2>
                <div className="space-y-3">
                  {sortedHours.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b last:border-0">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <CalendarIcon size={16} className="text-blue-500" />
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
              </Card>
            )}

            {/* Out Door Consulting */}
            {hasOutDoorConsulting && (
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building size={20} className="text-blue-500" />
                  Out Door Consulting
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Consulting Time</p>
                    <p className="text-gray-800">
                      {formatTime(outDoorConsulting.time.open)} - {formatTime(outDoorConsulting.time.close)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Consulting Place</p>
                    <p className="text-gray-800">{outDoorConsulting.place}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* About Section */}
            {doctor?.about && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserIcon size={20} className="text-blue-500" />
                  About Doctor
                </h2>
                <p className="text-gray-700 leading-relaxed">{doctor?.about}</p>
              </Card>
            )}
          </>
        )}

        {activeTab === 'appointments' && (
          <Appointments 
            doctorId={doctor?.id} 
            doctorName={doctorName} 
          />
        )}

        {activeTab === 'requests' && (
          <RequestTable 
            doctorId={doctor?.id} 
            doctorName={doctorName} 
          />
        )}
      </div>
    </div>
  );
};

export default DoctorDetails;