// src/pages/HospitalsBySpeciality.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Mail, ArrowLeft, Search, 
  Users, ChevronRight, Stethoscope, Loader, AlertCircle
} from 'lucide-react';
import { Card, Badge, Pagination } from '../../ui';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetAllHospitalsQuery } from '../../../../app/service/hospitalApi';
import { showErrorToast } from '../../ui/Toast';

const HospitalsBySpeciality = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const itemsPerPage = 9;

  // Get speciality info from navigation state
  const specialityName = location.state?.specialityName;
  const specialityId = location.state?.specialityId || id;

  console.log('===== HOSPITALS PAGE DEBUG =====');
  console.log('specialityName from state:', specialityName);
  console.log('specialityId from state/params:', specialityId);
  console.log('================================');

  // Step 1: Get ALL doctors by speciality name - WITH REFETCH FORCED
  const { 
    data: doctorsData, 
    isLoading: isLoadingDoctors,
    isError: doctorsError,
    error: doctorsErrorDetails,
    refetch: refetchDoctors
  } = useGetDoctorsQuery({
    speciality: specialityName,
    limit: 1000,
    page: 1
  }, {
    skip: !specialityName,
    refetchOnMountOrArgChange: true, // FORCE REFETCH - DON'T USE CACHE
    refetchOnReconnect: true,
    refetchOnFocus: true
  });

  // Step 2: Get ALL hospitals (once)
  const { 
    data: hospitalsData, 
    isLoading: isLoadingHospitals,
    isError: hospitalsError,
    refetch: refetchHospitals
  } = useGetAllHospitalsQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  // Step 3: Process and match doctors with hospitals
  useEffect(() => {
    const processData = async () => {
      if (!doctorsData || isLoadingDoctors) {
        console.log('Waiting for doctors data...');
        return;
      }
      if (!hospitalsData || isLoadingHospitals) {
        console.log('Waiting for hospitals data...');
        return;
      }

      try {
        // Get doctors array
        const doctors = doctorsData?.data?.rows || doctorsData?.data || doctorsData?.doctors || [];
        
        console.log('===== PROCESSING DATA =====');
        console.log('Doctors count:', doctors.length);
        console.log('Doctors raw data:', doctors);
        
        if (doctors.length === 0) {
          console.log('No doctors found for speciality:', specialityName);
          setHospitals([]);
          return;
        }
        
        // Get hospitals array
        const allHospitals = hospitalsData?.data || hospitalsData?.hospitals || hospitalsData || [];
        
        console.log('Total hospitals available:', allHospitals.length);
        console.log('Hospitals list:', allHospitals.map(h => ({ id: h.id, name: h.name })));
        
        // Get unique hospital IDs from doctors (convert to Number for proper comparison)
        const uniqueHospitalIds = [...new Set(
          doctors
            .filter(doctor => doctor.hospitalId)
            .map(doctor => Number(doctor.hospitalId))
        )];
        
        console.log('Unique Hospital IDs from doctors:', uniqueHospitalIds);
        
        // Log each doctor's hospitalId for debugging
        doctors.forEach(doctor => {
          console.log(`Doctor ${doctor.id}: hospitalId = ${doctor.hospitalId} (${typeof doctor.hospitalId})`);
        });
        
        // Match hospitals (convert both to Number for comparison)
        const matchedHospitals = allHospitals
          .filter(hospital => uniqueHospitalIds.includes(Number(hospital.id)))
          .map(hospital => ({
            ...hospital,
            doctorsCount: doctors.filter(d => Number(d.hospitalId) === Number(hospital.id)).length
          }));
        
        console.log('Matched Hospitals:', matchedHospitals.map(h => ({ id: h.id, name: h.name, doctorsCount: h.doctorsCount })));
        console.log(`Found ${matchedHospitals.length} matching hospitals`);
        
        setHospitals(matchedHospitals);
        
      } catch (error) {
        console.error('Error processing hospitals:', error);
        showErrorToast('Failed to process hospital data');
      }
    };

    processData();
  }, [doctorsData, isLoadingDoctors, hospitalsData, isLoadingHospitals, specialityName]);

  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter(hospital => 
    hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital?.address?.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);

  const handleHospitalClick = (hospital) => {
    console.log('Hospital clicked:', hospital.name, 'ID:', hospital.id);
    navigate(`/super-admin/hospital/${hospital.id}/doctors`, {
      state: {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        specialityName: specialityName,
        specialityId: specialityId,
      },
    });
  };

  // Manual refresh button handler
  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetchDoctors();
    refetchHospitals();
    showErrorToast('Refreshing data...', 2000);
  };

  // Loading state
  if (isLoadingDoctors || isLoadingHospitals) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#1C62A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hospitals offering {specialityName || 'this speciality'}...</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 text-sm text-[#1C62A0] border border-[#1C62A0] rounded-md hover:bg-[#1C62A0] hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (doctorsError || hospitalsError) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <button 
          onClick={() => navigate('/specialties')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Specialities</span>
        </button>
        
        <div className="text-center py-12 bg-white rounded-xl border border-red-200">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-500">
            {doctorsError ? 'Failed to load doctors data. ' : ''}
            {hospitalsError ? 'Failed to load hospitals data.' : ''}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-[#1C62A0] text-white rounded-md"
            >
              Retry
            </button>
            <button 
              onClick={() => navigate('/specialties')}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No hospitals found
  if (hospitals.length === 0 && !isLoadingDoctors && !isLoadingHospitals) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <button 
          onClick={() => navigate('/specialties')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Specialities</span>
        </button>
        
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-500">
            No doctors found for speciality: <strong>{specialityName}</strong>
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Make sure doctors in your system have this speciality assigned.
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 text-[#1C62A0] border border-[#1C62A0] rounded-md hover:bg-[#1C62A0] hover:text-white transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/super-admin/specialties')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Specialities</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hospitals offering {specialityName}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {hospitals.length} {hospitals.length === 1 ? 'hospital provides' : 'hospitals provide'} this speciality
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-gray-50"
            title="Refresh data"
          >
            <Loader size={16} className={isLoadingDoctors || isLoadingHospitals ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search hospitals by name, location, or email..."
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

      {/* Hospitals Grid */}
      {paginatedHospitals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedHospitals.map((hospital) => (
              <div
                key={hospital.id}
                onClick={() => handleHospitalClick(hospital)}
                className="cursor-pointer"
              >
                <Card className="p-6 hover:shadow-lg transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1C62A0] group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#1C62A0] transition-colors">
                    {hospital.name}
                  </h3>
                  
                  {hospital.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="mt-0.5" />
                      <span>{typeof hospital.address === 'string' ? hospital.address : hospital.address.place || ''}</span>
                    </div>
                  )}
                  
                  {hospital.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone size={14} />
                      <span>{hospital.phone}</span>
                    </div>
                  )}
                  
                  {hospital.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Mail size={14} />
                      <span className="truncate">{hospital.email}</span>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} />
                        <span>{hospital.doctorsCount || 0} doctors</span>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredHospitals.length}
                itemsPerPage={itemsPerPage}
                itemLabel="hospitals"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No hospitals match your search' : `No hospitals offer ${specialityName}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default HospitalsBySpeciality;