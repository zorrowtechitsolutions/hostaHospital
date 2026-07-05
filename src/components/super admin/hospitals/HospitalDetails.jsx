// src/components/super-admin/HospitalDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Stethoscope,
  Briefcase,
  Calendar,
  Activity,
  Ambulance,
  Droplet,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  ChevronRight,
  Bell,
  UserPlus
} from 'lucide-react';
import { Card, Button } from '../../ui';
import { useGetHospitalByIdQuery } from '../../../../app/service/hospitalApi';
import { useGetPatientsQuery } from '../../../../app/service/patients';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetAmbulanceQuery } from '../../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../../app/service/bloodbank';
import { 
  useGetUnreadNotificationsQuery,
  useGetReadNotificationsQuery 
} from '../../../../app/service/notification';

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: hospitalData, isLoading: isHospitalLoading, error } = useGetHospitalByIdQuery(id);
  const hospital = hospitalData?.data || hospitalData;

  // Fetch patients with hospitalId filter
  const { data: patientsData, isLoading: patientsLoading, refetch: refetchPatients } = useGetPatientsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: staffData, isLoading: staffLoading } = useGetStaffQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookingsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 100
  });
  
  const { data: ambulanceData, isLoading: ambulanceLoading } = useGetAmbulanceQuery({ 
    hospitalId: id
  });
  
  const { data: bloodBankData, isLoading: bloodBankLoading } = useGetBloodBankQuery({ 
    hospitalId: id
  });

  const { 
    data: unreadData, 
    isLoading: unreadLoading 
  } = useGetUnreadNotificationsQuery({
    role: 'hospital',
    id: Number(id),
  }, {
    skip: !id,
  });

  const { 
    data: readData, 
    isLoading: readLoading 
  } = useGetReadNotificationsQuery({
    role: 'hospital',
    id: Number(id),
  }, {
    skip: !id,
  });

  const unreadNotifications = unreadData?.data || [];
  const readNotifications = readData?.data || [];
  const notificationCount = unreadNotifications.length;

  // Calculate counts - using the actual filtered data from API
  const patientsList = patientsData?.data || [];
  const doctorsList = doctorsData?.data || [];
  const staffList = staffData?.data || [];
  const bookingsList = bookingsData?.data || [];
  const ambulancesList = ambulanceData?.data || [];
  const bloodBanksList = bloodBankData?.data || [];

  const patientsCount = patientsList.length;
  const doctorsCount = doctorsList.length;
  const staffCount = staffList.length;
  const appointmentsCount = bookingsList.filter(
    booking => booking.status !== 'completed' && booking.status !== 'cancelled'
  ).length;
  const visitsCount = bookingsList.filter(
    booking => booking.status === 'completed' || booking.status === 'accepted'
  ).length;
  const ambulancesCount = ambulancesList.length;
  const bloodBanksCount = bloodBanksList.length;

  const isLoading = isHospitalLoading || patientsLoading || doctorsLoading || staffLoading || bookingsLoading || ambulanceLoading || bloodBankLoading || unreadLoading || readLoading;

  const getFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.place, address.district, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Navigation handlers
  const navigateToPatients = () => {
    navigate(`/super-admin/hospitals/${id}/patients`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToDoctors = () => {
    navigate(`/super-admin/hospitals/${id}/doctors`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToStaff = () => {
    navigate(`/super-admin/hospitals/${id}/staff`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToAppointments = () => {
    navigate(`/super-admin/hospitals/${id}/appointments`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToVisits = () => {
    navigate(`/super-admin/hospitals/${id}/visits`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToAmbulances = () => {
    navigate(`/super-admin/hospitals/${id}/ambulances`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToBloodBanks = () => {
    navigate(`/super-admin/hospitals/${id}/blood-banks`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  const navigateToNotifications = () => {
    navigate(`/super-admin/hospitals/${id}/notifications`, { 
      state: { 
        hospitalId: id,
        hospitalName: hospital?.name 
      } 
    });
  };

  // Handle add new patient
  const handleAddPatient = () => {
    navigate(`/super-admin/hospitals/${id}/patients/add`, {
      state: {
        hospitalId: id,
        hospitalName: hospital?.name
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1] mx-auto mb-3" />
          <p className="text-gray-500">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Hospital not found</p>
        <Button onClick={() => navigate('/super-admin/hospitals')} className="mt-4">
          Back to Hospitals
        </Button>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Patients', 
      value: patientsCount, 
      icon: Users, 
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-50/50',
      onClick: navigateToPatients,
      description: `${patientsCount} patients registered`,
      actionLabel: 'View All Patients'
    },
    { 
      title: 'Total Doctors', 
      value: doctorsCount, 
      icon: Stethoscope, 
      bgColor: 'bg-green-50',
      iconBgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-50/50',
      onClick: navigateToDoctors,
      description: `${doctorsCount} doctors available`,
      actionLabel: 'View All Doctors'
    },
    { 
      title: 'Total Staff', 
      value: staffCount, 
      icon: Briefcase, 
      bgColor: 'bg-purple-50',
      iconBgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-50/50',
      onClick: navigateToStaff,
      description: `${staffCount} staff members`,
      actionLabel: 'View All Staff'
    },
    { 
      title: 'Appointments', 
      value: appointmentsCount, 
      icon: Calendar, 
      bgColor: 'bg-orange-50',
      iconBgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-50/50',
      onClick: navigateToAppointments,
      description: `${appointmentsCount} upcoming appointments`,
      actionLabel: 'View Appointments'
    },
    { 
      title: 'Total Visits', 
      value: visitsCount, 
      icon: Activity, 
      bgColor: 'bg-indigo-50',
      iconBgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-50/50',
      onClick: navigateToVisits,
      description: `${visitsCount} completed visits`,
      actionLabel: 'View Visits'
    },
    { 
      title: 'Ambulances', 
      value: ambulancesCount, 
      icon: Ambulance, 
      bgColor: 'bg-red-50',
      iconBgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverBg: 'hover:bg-red-50/50',
      onClick: navigateToAmbulances,
      description: `${ambulancesCount} ambulance${ambulancesCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Ambulances'
    },
    { 
      title: 'Blood Banks', 
      value: bloodBanksCount, 
      icon: Droplet, 
      bgColor: 'bg-pink-50',
      iconBgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      hoverBg: 'hover:bg-pink-50/50',
      onClick: navigateToBloodBanks,
      description: `${bloodBanksCount} blood bank${bloodBanksCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Blood Banks'
    },
    { 
      title: 'Notifications', 
      value: notificationCount, 
      icon: Bell, 
      bgColor: 'bg-yellow-50',
      iconBgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      hoverBg: 'hover:bg-yellow-50/50',
      onClick: navigateToNotifications,
      description: `${notificationCount} unread notification${notificationCount !== 1 ? 's' : ''}`,
      actionLabel: 'View Notifications'
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/super-admin/hospitals')} 
          className="mb-4"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Hospitals
        </Button>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{hospital.name}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {hospital.id}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">Status:</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                <span className="text-xs text-gray-400 ml-2">Last Updated:</span>
                <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{hospital.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{hospital.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm text-gray-900 capitalize">{hospital.type || 'Hospital'}</p>
            </div>
          </div>
          {hospital.address && (
            <div className="flex items-start gap-3 col-span-2">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{getFullAddress(hospital.address)}</p>
              </div>
            </div>
          )}
          {hospital.emergencyContact && (
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Emergency Contact</p>
                <p className="text-sm text-gray-900">{hospital.emergencyContact}</p>
              </div>
            </div>
          )}
        </div>
        
        {hospital.about && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">About</p>
            <p className="text-sm text-gray-700">{hospital.about}</p>
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overview Statistics</h2>
          <span className="text-sm text-gray-400">Click any card to view details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                onClick={stat.onClick}
                className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
              >
                <Card className={`p-5 border ${stat.borderColor} hover:shadow-lg transition-all duration-300 ${stat.hoverBg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors truncate">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`${stat.iconBgColor || stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2`}>
                      <Icon size={22} className={stat.textColor} />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                      {stat.actionLabel}
                    </span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HospitalDetails;