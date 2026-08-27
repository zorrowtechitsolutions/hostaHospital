// src/components/super-admin/RecentActivity.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Megaphone,
  Users,
  Activity,
  Ambulance,
  Droplet,
  User,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Calendar,
  Clock,
  Hospital,
  UserPlus,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Pagination } from '../ui';
import { useGetAllHospitalsQuery } from '../../../app/service/hospitalApi';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetPatientsQuery } from '../../../app/service/patients';
import { useGetStaffQuery } from '../../../app/service/staffApi';
import { useGetAdsQuery } from '../../../app/service/ads';
import { useGetAmbulanceQuery } from '../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../app/service/bloodbank';
import { useGetUsersQuery } from '../../../app/service/users';
import { useGetDonorsQuery } from '../../../app/service/blooddonor';

const RecentActivity = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const { data: doctorsData, isLoading: loadingDoctors } = useGetDoctorsQuery({
    skipHospitalFilter: true
  });
  const { data: patientsData, isLoading: loadingPatients } = useGetPatientsQuery();
  const { data: staffData, isLoading: loadingStaff } = useGetStaffQuery();
  const { data: adsData, isLoading: loadingAds } = useGetAdsQuery();
  const { data: ambulanceData, isLoading: loadingAmbulance } = useGetAmbulanceQuery({
    skipHospitalFilter: true,
  });
  const { data: bloodBankData, isLoading: loadingBloodBank } = useGetBloodBankQuery();
  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery({
    limit: 1000
  });
  const { data: donorsData, isLoading: loadingDonors } = useGetDonorsQuery({
    limit: 1000
  });

  // ============================================================
  // Helper function for relative time display
  // ============================================================
  const getRelativeTime = (date) => {
    if (!date) return 'Just now';

    const now = new Date();
    const created = new Date(date);

    if (Number.isNaN(created.getTime())) {
      return 'Recently';
    }

    const diffInSeconds = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diffInSeconds < 10) {
      return 'Just now';
    }

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 1) {
      return 'Yesterday';
    }

    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return created.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    const icons = {
      hospital: Building2,
      doctor: Stethoscope,
      staff: User,
      patient: Users,
      user: UserPlus,
      donor: Droplet,
      ad: Megaphone,
      ambulance: Ambulance,
      bloodbank: Droplet
    };
    const Icon = icons[type] || Activity;
    return Icon;
  };

  const getActivityColor = (type) => {
    const colors = {
      hospital: 'bg-blue-50 text-blue-500',
      doctor: 'bg-emerald-50 text-emerald-500',
      staff: 'bg-purple-50 text-purple-500',
      patient: 'bg-cyan-50 text-cyan-500',
      user: 'bg-indigo-50 text-indigo-500',
      donor: 'bg-pink-50 text-pink-500',
      ad: 'bg-amber-50 text-amber-500',
      ambulance: 'bg-red-50 text-red-500',
      bloodbank: 'bg-rose-50 text-rose-500'
    };
    return colors[type] || 'bg-gray-50 text-gray-500';
  };

  useEffect(() => {
    const loadData = async () => {
      if (loadingHospitals || loadingDoctors || loadingPatients || loadingStaff || 
          loadingAds || loadingAmbulance || loadingBloodBank || loadingUsers || loadingDonors) {
        return;
      }

      const hospitals = hospitalsData?.data || hospitalsData || [];
      const doctors = doctorsData?.data?.rows || doctorsData?.data || doctorsData?.doctors || [];
      const patients = patientsData?.data || [];
      const ads = adsData?.data || adsData?.ads || [];
      const ambulances = ambulanceData?.data || [];
      
      let staff = [];
      if (staffData?.data?.rows) {
        staff = staffData.data.rows;
      } else if (staffData?.data) {
        staff = Array.isArray(staffData.data) ? staffData.data : [];
      } else if (Array.isArray(staffData)) {
        staff = staffData;
      } else if (staffData?.staff) {
        staff = Array.isArray(staffData.staff) ? staffData.staff : [];
      }
      
      const bloodBanks = bloodBankData?.data || [];
      const users = usersData?.data || usersData?.users || [];
      const donors = donorsData?.data || donorsData?.donors || [];

      const allActivities = [];

      // HOSPITAL CREATED
      hospitals.forEach((hospital) => {
        const createdAt = hospital.createdAt || hospital.created_at || hospital.registeredAt;
        if (createdAt) {
          allActivities.push({
            id: `hospital-${hospital.id || hospital._id}`,
            type: 'hospital',
            entity: hospital.name || hospital.hospitalName || 'Hospital',
            action: 'hospital created',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // DOCTOR CREATED
      doctors.forEach((doctor) => {
        const createdAt = doctor.createdAt || doctor.created_at || doctor.registeredAt;
        if (createdAt) {
          const doctorName = doctor.displayName ||
            `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() ||
            doctor.name || 'Doctor';

          const hospitalId = doctor.hospitalId || doctor.hospital_id || doctor.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          allActivities.push({
            id: `doctor-${doctor.id || doctor._id}`,
            type: 'doctor',
            entity: doctorName,
            action: hospital
              ? `doctor created in ${hospital.name || hospital.hospitalName}`
              : 'doctor created',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // STAFF CREATED
      staff.forEach((member) => {
        const createdAt = member.createdAt || member.created_at || member.joiningDate;
        if (createdAt) {
          const memberName = member.name || member.fullName || 'Staff member';
          const hospitalId = member.hospitalId || member.hospital_id || member.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          allActivities.push({
            id: `staff-${member.id || member._id}`,
            type: 'staff',
            entity: memberName,
            action: hospital
              ? `staff added to ${hospital.name || hospital.hospitalName}`
              : 'staff added',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // PATIENT CREATED
      patients.forEach((patient) => {
        const createdAt = patient.createdAt || patient.created_at || patient.registeredAt;
        if (createdAt) {
          const patientName = patient.name ||
            `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
            'Patient';

          const hospitalId = patient.hospitalId || patient.hospital_id || patient.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          allActivities.push({
            id: `patient-${patient.id || patient._id}`,
            type: 'patient',
            entity: patientName,
            action: hospital
              ? `patient registered at ${hospital.name || hospital.hospitalName}`
              : 'patient registered',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // USER CREATED (All users - no hospital filter)
      users.forEach((user) => {
        const createdAt = user.createdAt || user.created_at || user.registeredAt;
        if (createdAt) {
          allActivities.push({
            id: `user-${user.id || user._id}`,
            type: 'user',
            entity: user.name || 'User',
            action: 'user created',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // ADVERTISEMENT CREATED
      ads.forEach((ad) => {
        const createdAt = ad.createdAt || ad.created_at;
        if (createdAt) {
          allActivities.push({
            id: `ad-${ad.id || ad._id}`,
            type: 'ad',
            entity: ad.title || 'Advertisement',
            action: 'advertisement created',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // AMBULANCE ADDED (with creator info if available)
      ambulances.forEach((ambulance) => {
        const createdAt = ambulance.createdAt || ambulance.created_at;
        if (createdAt) {
          const hospitalId = ambulance.hospitalId || ambulance.hospital_id || ambulance.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          // Who added the ambulance
          const creatorId = ambulance.createdBy || ambulance.created_by || ambulance.createdById || ambulance.userId || ambulance.user_id;
          const creator = users.find((u) => String(u.id || u._id) === String(creatorId));
          const creatorName = ambulance.createdByName || ambulance.created_by_name || creator?.name || 'User';

          const ambulanceName = ambulance.vehicleNumber || ambulance.registrationNumber || ambulance.serviceName || ambulance.name || 'Ambulance';

          allActivities.push({
            id: `ambulance-${ambulance.id || ambulance._id}`,
            type: 'ambulance',
            entity: ambulanceName,
            action: hospital
              ? `ambulance added to ${hospital.name || hospital.hospitalName} by ${creatorName}`
              : `ambulance added by ${creatorName}`,
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // BLOOD BANK ADDED
      bloodBanks.forEach((bloodBank) => {
        const createdAt = bloodBank.createdAt || bloodBank.created_at;
        if (createdAt) {
          const hospitalId = bloodBank.hospitalId || bloodBank.hospital_id || bloodBank.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          allActivities.push({
            id: `bloodbank-${bloodBank.id || bloodBank._id}`,
            type: 'bloodbank',
            entity: bloodBank.name || 'Blood Bank',
            action: hospital
              ? `blood bank added to ${hospital.name || hospital.hospitalName}`
              : 'blood bank added',
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // BLOOD DONOR ADDED (with creator info if available)
      donors.forEach((donor) => {
        const createdAt = donor.createdAt || donor.created_at || donor.registeredAt;
        if (createdAt) {
          const donorName = donor.name || donor.fullName ||
            `${donor.firstName || ''} ${donor.lastName || ''}`.trim() ||
            'Blood Donor';

          const hospitalId = donor.hospitalId || donor.hospital_id || donor.hospital?.id;
          const hospital = hospitals.find((h) => String(h.id || h._id) === String(hospitalId));

          // Who created/added the donor
          const creatorId = donor.createdBy || donor.created_by || donor.createdById || donor.userId || donor.user_id;
          const creator = users.find((u) => String(u.id || u._id) === String(creatorId));
          const creatorName = donor.createdByName || donor.created_by_name || creator?.name || 'User';

          allActivities.push({
            id: `donor-${donor.id || donor._id}`,
            type: 'donor',
            entity: donorName,
            action: hospital
              ? `blood donor added to ${hospital.name || hospital.hospitalName} by ${creatorName}`
              : `blood donor added by ${creatorName}`,
            time: getRelativeTime(createdAt),
            createdAt,
          });
        }
      });

      // SORT - newest first
      allActivities.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setActivities(allActivities);
      setFilteredActivities(allActivities);
      setLoading(false);
      setCurrentPage(1); // Reset to first page when data loads
    };

    loadData();
  }, [
    hospitalsData,
    doctorsData,
    patientsData,
    staffData,
    adsData,
    ambulanceData,
    bloodBankData,
    usersData,
    donorsData,
    loadingHospitals,
    loadingDoctors,
    loadingPatients,
    loadingStaff,
    loadingAds,
    loadingAmbulance,
    loadingBloodBank,
    loadingUsers,
    loadingDonors
  ]);

  // Apply filters
  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.entity.toLowerCase().includes(term) ||
          activity.action.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === typeFilter);
    }

    setFilteredActivities(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, typeFilter, activities]);

  // Pagination calculations
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of the list
      document.getElementById('activity-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const activityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'doctor', label: 'Doctors' },
    { value: 'staff', label: 'Staff' },
    { value: 'patient', label: 'Patients' },
    { value: 'user', label: 'Users' },
    { value: 'donor', label: 'Blood Donors' },
    { value: 'ad', label: 'Ads' },
    { value: 'ambulance', label: 'Ambulances' },
    { value: 'bloodbank', label: 'Blood Banks' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1C62A0] border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Activity</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} activity item{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            setSearchTerm('');
            setTypeFilter('all');
            setCurrentPage(1);
          }}
        >
          <RefreshCw size={14} className="mr-1" />
          Reset
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent bg-white cursor-pointer min-w-[150px]"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1C62A0] focus:border-transparent bg-white cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ml-[-24px]" />
            </div>

            {/* Clear Filters */}
            {(searchTerm || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className="text-xs text-[#1C62A0] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Activities Timeline */}
      <div id="activity-list" className="space-y-4">
        {currentItems.length > 0 ? (
          currentItems.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < currentItems.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#1C62A0] hover:shadow-md transition-all duration-300">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {activity.entity}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {activity.action}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                    
                    {/* Type badge */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                        <Icon size={12} />
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-600">No activities found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination - Using global Pagination component with green gradient */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default RecentActivity;