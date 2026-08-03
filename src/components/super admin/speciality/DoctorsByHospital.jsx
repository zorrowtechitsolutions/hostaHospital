// src/pages/DoctorsByHospital.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  UserCircle, Phone, Mail, Calendar, ArrowLeft, Search,
  Award, Clock, Stethoscope, Building2, Loader, AlertCircle
} from 'lucide-react';
import { Card, Badge, Pagination } from '../../ui';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetHospitalByIdQuery } from '../../../../app/service/hospitalApi';

const DoctorsByHospital = () => {
  const { hospitalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Get data from navigation state
  const hospitalNameFromState = location.state?.hospitalName;
  const specialityName = location.state?.specialityName;
  const specialityId = location.state?.specialityId;



  // Fetch hospital details if name wasn't passed in state
  const { data: hospitalData, isLoading: isLoadingHospital } = useGetHospitalByIdQuery(hospitalId, {
    skip: !hospitalId || !!hospitalNameFromState
  });

  const hospitalName = hospitalNameFromState || hospitalData?.name || hospitalData?.data?.name;

  // Get doctors filtered by hospitalId AND speciality
  const { 
    data: doctorsData, 
    isLoading: isLoadingDoctors, 
    isFetching,
    error: doctorsError,
    refetch
  } = useGetDoctorsQuery({
    hospitalId: hospitalId,
    speciality: specialityName,
    search_query: searchTerm || undefined,
    page: currentPage,
    limit: itemsPerPage
  }, {
    skip: !hospitalId
  });

  // Handle API response structure correctly
  const doctors = doctorsData?.data || [];
  const totalItems = doctors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const isLoading = isLoadingDoctors || isLoadingHospital;

  // Handle invalid state
  useEffect(() => {
    if (!hospitalId) {
      navigate('/specialties');
    }
  }, [hospitalId, navigate]);

  // Doctor click handler - navigates to doctor details page
 const handleDoctorClick = (doctor) => {
  navigate(`/super-admin/doctors/${doctor.id}`, {
    state: {
      hospitalId,
      hospitalName,
      specialityName,
      specialityId,
      fromPage: "doctors-by-speciality",
    },
  });
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#1C62A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Loading {specialityName || ''} specialists at {hospitalName || 'hospital'}...
          </p>
        </div>
      </div>
    );
  }

  if (doctorsError) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Hospitals</span>
        </button>
        
        <div className="text-center py-12 bg-white rounded-xl border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Doctors</h3>
          <p className="text-gray-500">
            Failed to load doctors. Please try again later.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-[#1C62A0] text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (doctors.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Hospitals</span>
        </button>
        
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'No doctors match your search criteria' 
              : `No doctors specialize in ${specialityName || 'this speciality'} at ${hospitalName || 'this hospital'} yet`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Hospitals</span>
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {specialityName || 'Speciality'} Specialists
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Building2 size={16} className="text-gray-400" />
              <p className="text-sm text-gray-500">{hospitalName || `Hospital ID: ${hospitalId}`}</p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 ml-15">
          {totalItems} {totalItems === 1 ? 'doctor specializes' : 'doctors specialize'} in {specialityName || 'this speciality'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search doctors by name, department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1C62A0]"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Doctors Grid */}
      {doctors.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => {
              // Get the doctor's display name safely
              const doctorDisplayName = doctor.displayName || doctor.name || `Doctor ${doctor.id}`;
              
              return (
                <Card 
                  key={doctor.id} 
                  onClick={() => handleDoctorClick(doctor)}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Doctor Avatar */}
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4">
                      {doctor.image || doctor.profileImage ? (
                        <img 
                          src={doctor.image || doctor.profileImage} 
                          alt={doctorDisplayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-12 h-12 text-purple-600" />
                      )}
                    </div>
                    
                    {/* Doctor Name */}
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {doctorDisplayName}
                    </h3>
                    
                    {/* Department/Speciality */}
                    {(doctor.department || doctor.speciality || doctor.specialist) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Stethoscope size={14} />
                        <span>{doctor.department || doctor.speciality || doctor.specialist}</span>
                      </div>
                    )}
                    
                    {/* Qualification */}
                    {doctor.qualification && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Award size={14} />
                        <span>{doctor.qualification}</span>
                      </div>
                    )}
                    
                    {/* Experience */}
                    {doctor.experience && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <Clock size={14} />
                        <span>{doctor.experience} years experience</span>
                      </div>
                    )}
                    
                    {/* Contact Information */}
                    <div className="w-full space-y-2 text-sm mb-4 pt-3 border-t border-gray-100">
                      {doctor.email && (
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Mail size={14} />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                      {doctor.phone && (
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Phone size={14} />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center justify-between w-full pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Joined: {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <Badge variant={doctor.status === 'active' || doctor.isActive ? 'success' : 'danger'}>
                        {doctor.status === 'active' || doctor.isActive ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="doctors"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorsByHospital;