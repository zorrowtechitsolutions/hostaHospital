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
  Loader2
} from 'lucide-react';
import { Card, Button } from '../../ui';
import { useGetHospitalByIdQuery } from '../../../../app/service/hospitalApi';
import { useGetPatientsQuery } from '../../../../app/service/patients';
import { useGetDoctorsQuery } from '../../../../app/service/doctorApi';
import { useGetStaffQuery } from '../../../../app/service/staffApi';
import { useGetBookingsQuery } from '../../../../app/service/request';
import { useGetAmbulanceQuery } from '../../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../../app/service/bloodbank';

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch hospital details
  const { data: hospitalData, isLoading: isHospitalLoading, error } = useGetHospitalByIdQuery(id);
  const hospital = hospitalData?.data || hospitalData;

  // Fetch data for this hospital
  const { data: patientsData, isLoading: patientsLoading } = useGetPatientsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 1000
  });
  
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 1000
  });
  
  const { data: staffData, isLoading: staffLoading } = useGetStaffQuery({ 
    hospitalId: id,
    page: 1,
    limit: 1000
  });
  
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookingsQuery({ 
    hospitalId: id,
    page: 1,
    limit: 1000
  });
  
  const { data: ambulanceData, isLoading: ambulanceLoading } = useGetAmbulanceQuery({ 
    hospitalId: id
  });
  
  const { data: bloodBankData, isLoading: bloodBankLoading } = useGetBloodBankQuery({ 
    hospitalId: id
  });

  // ✅ DEBUG LOGS - Check what the API is actually returning
  useEffect(() => {
    if (doctorsData?.data) {
      console.log("=== HOSPITAL DETAILS DEBUG ===");
      console.log("Current Hospital ID from URL:", id);
      console.log("Doctors Data:", doctorsData.data);
      console.log("Doctors hospitalIds:", doctorsData.data.map(d => ({ id: d.id, hospitalId: d.hospitalId })));
      console.log("Patients Data:", patientsData?.data);
      console.log("Staff Data:", staffData?.data);
      console.log("Bookings Data:", bookingsData?.data);
      console.log("Ambulance Data:", ambulanceData?.data);
      console.log("Blood Bank Data:", bloodBankData?.data);
    }
  }, [id, doctorsData, patientsData, staffData, bookingsData, ambulanceData, bloodBankData]);

  // ✅ FIXED: Filter counts by hospitalId manually since API might not be filtering
  const patientsCount = patientsData?.data?.filter(
    patient => String(patient.hospitalId) === String(id)
  ).length || 0;
  
  const doctorsCount = doctorsData?.data?.filter(
    doctor => String(doctor.hospitalId) === String(id)
  ).length || 0;
  
  const staffCount = staffData?.data?.filter(
    staff => String(staff.hospitalId) === String(id)
  ).length || 0;
  
  const appointmentsCount = bookingsData?.data?.filter(
    booking => String(booking.hospitalId) === String(id)
  ).length || 0;
  
  const ambulancesCount = ambulanceData?.data?.filter(
    ambulance => String(ambulance.hospitalId) === String(id)
  ).length || 0;
  
  const bloodBanksCount = bloodBankData?.data?.filter(
    bank => String(bank.hospitalId) === String(id)
  ).length || 0;
  
  // Visits count - using appointments as visits for now
  const visitsCount = appointmentsCount;

  const isLoading = isHospitalLoading || patientsLoading || doctorsLoading || staffLoading || bookingsLoading || ambulanceLoading || bloodBankLoading;

  const getFullAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.place, address.district, address.state, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Navigation handlers for each card
  const navigateToPatients = () => {
    navigate(`/super-admin/hospitals/${id}/patients`);
  };

  const navigateToDoctors = () => {
    navigate(`/super-admin/hospitals/${id}/doctors`);
  };

  const navigateToStaff = () => {
    navigate(`/super-admin/hospitals/${id}/staff`);
  };

  const navigateToAppointments = () => {
    navigate(`/super-admin/hospitals/${id}/appointments`);
  };

  const navigateToVisits = () => {
    navigate(`/super-admin/hospitals/${id}/visits`);
  };

  const navigateToAmbulances = () => {
    navigate(`/super-admin/hospitals/${id}/ambulances`);
  };

  const navigateToBloodBanks = () => {
    navigate(`/super-admin/hospitals/${id}/blood-banks`);
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
      textColor: 'text-blue-600',
      onClick: navigateToPatients,
    },
    { 
      title: 'Total Doctors', 
      value: doctorsCount, 
      icon: Stethoscope, 
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      onClick: navigateToDoctors,
    },
    { 
      title: 'Total Staff', 
      value: staffCount, 
      icon: Briefcase, 
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      onClick: navigateToStaff,
    },
    { 
      title: 'Appointments', 
      value: appointmentsCount, 
      icon: Calendar, 
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      onClick: navigateToAppointments,
    },
    { 
      title: 'Total Visits', 
      value: visitsCount, 
      icon: Activity, 
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      onClick: navigateToVisits,
    },
    { 
      title: 'Ambulances', 
      value: ambulancesCount, 
      icon: Ambulance, 
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      onClick: navigateToAmbulances,
    },
    { 
      title: 'Blood Banks', 
      value: bloodBanksCount, 
      icon: Droplet, 
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      onClick: navigateToBloodBanks,
    }
  ];

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/super-admin/hospitals')} 
          className="mb-4"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Hospitals
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{hospital.name}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {hospital.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Information Card */}
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

      {/* Statistics Cards Grid - Clickable Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                onClick={stat.onClick}
                className="cursor-pointer transition-all duration-200 hover:scale-105"
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-xl`}>
                      <Icon size={24} className={stat.textColor} />
                    </div>
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