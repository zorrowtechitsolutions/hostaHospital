// src/components/super-admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Tag,
  Stethoscope,
  Megaphone,
  Users,
  Activity,
  Calendar,
  Clock,
  Ambulance,
  Droplet,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  ArrowRight,
  Shield,
  Hospital,
  UserPlus,
  Briefcase,
  Layers,
  FileText,
  Plus,
  UserCheck
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useGetAllHospitalsQuery } from '../../../app/service/hospitalApi';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetBookingsQuery } from '../../../app/service/request';
import { useGetAdsQuery } from '../../../app/service/ads';
import { useGetAmbulanceQuery } from '../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../app/service/bloodbank';
import { useGetPatientsQuery } from '../../../app/service/patients';
import { useGetStaffQuery } from '../../../app/service/staffApi';
import { useGetUsersQuery } from '../../../app/service/users';
import { useGetDonorsQuery } from '../../../app/service/blooddonor';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    acceptedAppointments: 0,
    completedAppointments: 0,
    declinedAppointments: 0,
    cancelledAppointments: 0,
    totalAmbulances: 0,
    totalBloodUnits: 0,
    totalAds: 0,
    totalStaff: 0,
    totalUsers: 0,
    totalDonors: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const { data: doctorsData, isLoading: loadingDoctors } = useGetDoctorsQuery({
    skipHospitalFilter: true
  });
  const { data: patientsData, isLoading: loadingPatients } = useGetPatientsQuery();
  const { data: appointmentsData, isLoading: loadingAppointments } = useGetBookingsQuery({
    skipHospitalFilter: true,
  });
  const { data: adsData, isLoading: loadingAds } = useGetAdsQuery();
  const { data: staffData, isLoading: loadingStaff } = useGetStaffQuery();
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

  useEffect(() => {
    const loadData = async () => {
      if (loadingHospitals || loadingDoctors || loadingPatients || loadingAppointments || 
          loadingAds || loadingStaff || loadingAmbulance || loadingBloodBank || loadingUsers || loadingDonors) {
        return;
      }

      const hospitals = hospitalsData?.data || hospitalsData || [];
      const doctors = doctorsData?.data?.rows || doctorsData?.data || doctorsData?.doctors || [];
      const patients = patientsData?.data || [];
      
      let appointments = [];
      
      if (appointmentsData) {
        if (Array.isArray(appointmentsData)) {
          appointments = appointmentsData;
        } 
        else if (appointmentsData.data) {
          if (Array.isArray(appointmentsData.data)) {
            appointments = appointmentsData.data;
          } else if (appointmentsData.data.rows && Array.isArray(appointmentsData.data.rows)) {
            appointments = appointmentsData.data.rows;
          } else if (appointmentsData.data.bookings && Array.isArray(appointmentsData.data.bookings)) {
            appointments = appointmentsData.data.bookings;
          } else if (typeof appointmentsData.data === 'object' && !Array.isArray(appointmentsData.data)) {
            for (const key in appointmentsData.data) {
              if (Array.isArray(appointmentsData.data[key]) && appointmentsData.data[key].length > 0) {
                appointments = appointmentsData.data[key];
                break;
              }
            }
          }
        } 
        else if (appointmentsData.bookings && Array.isArray(appointmentsData.bookings)) {
          appointments = appointmentsData.bookings;
        } 
        else if (appointmentsData.rows && Array.isArray(appointmentsData.rows)) {
          appointments = appointmentsData.rows;
        } else {
          for (const key in appointmentsData) {
            if (Array.isArray(appointmentsData[key]) && appointmentsData[key].length > 0) {
              appointments = appointmentsData[key];
              break;
            }
          }
        }
      }
      
      const pending = appointments.filter(a => {
        const status = (a.status || a.booking_status || a.bookingStatus || '').toLowerCase();
        return status === 'pending' || status === 'requested';
      }).length;
      
      const accepted = appointments.filter(a => {
        const status = (a.status || a.booking_status || a.bookingStatus || '').toLowerCase();
        return status === 'accepted' || status === 'confirmed' || status === 'approve' || status === 'approved';
      }).length;
      
      const completed = appointments.filter(a => {
        const status = (a.status || a.booking_status || a.bookingStatus || '').toLowerCase();
        return status === 'completed' || status === 'complete' || status === 'done';
      }).length;
      
      const declined = appointments.filter(a => {
        const status = (a.status || a.booking_status || a.bookingStatus || '').toLowerCase();
        return status === 'declined' || status === 'rejected' || status === 'decline' || status === 'denied';
      }).length;
      
      const cancelled = appointments.filter(a => {
        const status = (a.status || a.booking_status || a.bookingStatus || '').toLowerCase();
        return status === 'cancel' || status === 'cancelled' || status === 'canceled';
      }).length;
      
      const total = appointments.length;

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
      const totalBloodUnits = bloodBanks.length;

      const users = usersData?.data || usersData?.users || [];
      const totalUsers = users.length;

      const donors = donorsData?.data || donorsData?.donors || [];
      const totalDonors = donors.length;

      setStats({
        totalHospitals: hospitals.length,
        activeHospitals: hospitals.filter(h => h.status === 'active' || h.isActive === true).length,
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        totalAppointments: total,
        pendingAppointments: pending,
        acceptedAppointments: accepted,
        completedAppointments: completed,
        declinedAppointments: declined,
        cancelledAppointments: cancelled,
        totalAmbulances: ambulances.length,
        totalBloodUnits: totalBloodUnits,
        totalAds: ads.length,
        totalStaff: staff.length,
        totalUsers: totalUsers,
        totalDonors: totalDonors
      });

      const activities = [];
      const appointmentsList = [];

      // ============================================================
      // Process appointments for the separate Recent Appointments section
      // ============================================================
      appointments
        .slice(0, 5)
        .forEach((appointment) => {
          const patientName =
            appointment.patient_name ||
            appointment.patientName ||
            appointment.patient?.name ||
            'Patient';

          const doctorName =
            appointment.displayName ||
            appointment.doctorName ||
            appointment.doctor_name ||
            appointment.doctor?.displayName ||
            'Doctor';

          const hospitalId =
            appointment.hospitalId ||
            appointment.hospital_id ||
            appointment.hospital?.id;

          const hospital = hospitals.find(
            (h) => String(h.id || h._id) === String(hospitalId)
          );

          const hospitalName =
            appointment.hospitalName ||
            appointment.hospital_name ||
            appointment.hospital?.name ||
            hospital?.name ||
            hospital?.hospitalName ||
            'Hospital';

          const status = (
            appointment.status ||
            appointment.booking_status ||
            appointment.bookingStatus ||
            'pending'
          ).toLowerCase();

          let action = 'requested appointment';
          let statusType = 'warning';

          if (
            status === 'accepted' ||
            status === 'confirmed' ||
            status === 'approve' ||
            status === 'approved'
          ) {
            action = 'confirmed appointment';
            statusType = 'info';
          } else if (
            status === 'completed' ||
            status === 'complete' ||
            status === 'done'
          ) {
            action = 'completed appointment';
            statusType = 'success';
          } else if (
            status === 'declined' ||
            status === 'rejected' ||
            status === 'decline' ||
            status === 'denied'
          ) {
            action = 'declined appointment';
            statusType = 'error';
          } else if (
            status === 'cancel' ||
            status === 'cancelled' ||
            status === 'canceled'
          ) {
            action = 'cancelled appointment';
            statusType = 'error';
          }

          const time = getRelativeTime(
            appointment.createdAt ||
            appointment.created_at ||
            appointment.requestedAt ||
            appointment.booking_date
          );

          appointmentsList.push({
            id: appointment.id || appointment._id || Math.random().toString(),
            patientName,
            doctorName,
            hospitalName,
            action,
            time,
            status: statusType,
            statusLabel: status
          });
        });

      // ============================================================
      // RECENT ACTIVITY - Only admin/system actions (NO appointments)
      // ============================================================

      // --------------------------------------------
      // HOSPITAL CREATED
      // --------------------------------------------
      hospitals.forEach((hospital) => {
        const createdAt =
          hospital.createdAt ||
          hospital.created_at ||
          hospital.registeredAt;

        if (createdAt) {
          activities.push({
            id: `hospital-${hospital.id || hospital._id}`,
            type: 'hospital',
            entity: hospital.name || hospital.hospitalName || 'Hospital',
            action: 'hospital created',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'info'
          });
        }
      });

      // --------------------------------------------
      // DOCTOR CREATED
      // --------------------------------------------
      doctors.forEach((doctor) => {
        const createdAt =
          doctor.createdAt ||
          doctor.created_at ||
          doctor.registeredAt;

        if (createdAt) {
          const doctorName =
            doctor.displayName ||
            `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() ||
            doctor.name ||
            'Doctor';

          const hospitalId =
            doctor.hospitalId ||
            doctor.hospital_id ||
            doctor.hospital?.id;

          const hospital = hospitals.find(
            (h) => String(h.id || h._id) === String(hospitalId)
          );

          activities.push({
            id: `doctor-${doctor.id || doctor._id}`,
            type: 'doctor',
            entity: doctorName,
            action: hospital
              ? `doctor created in ${hospital.name || hospital.hospitalName}`
              : 'doctor created',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'success'
          });
        }
      });

      // --------------------------------------------
      // STAFF CREATED
      // --------------------------------------------
      staff.forEach((member) => {
        const createdAt =
          member.createdAt ||
          member.created_at ||
          member.joiningDate;

        if (createdAt) {
          const memberName = member.name || member.fullName || 'Staff member';
          
          const hospitalId =
            member.hospitalId ||
            member.hospital_id ||
            member.hospital?.id;

          const hospital = hospitals.find(
            (h) => String(h.id || h._id) === String(hospitalId)
          );

          activities.push({
            id: `staff-${member.id || member._id}`,
            type: 'staff',
            entity: memberName,
            action: hospital
              ? `staff added to ${hospital.name || hospital.hospitalName}`
              : 'staff added',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'info'
          });
        }
      });

      // --------------------------------------------
      // PATIENT CREATED
      // --------------------------------------------
      patients.forEach((patient) => {
        const createdAt =
          patient.createdAt ||
          patient.created_at ||
          patient.registeredAt;

        if (createdAt) {
          const patientName =
            patient.name ||
            `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
            'Patient';

          const hospitalId =
            patient.hospitalId ||
            patient.hospital_id ||
            patient.hospital?.id;

          const hospital = hospitals.find(
            (h) => String(h.id || h._id) === String(hospitalId)
          );

          activities.push({
            id: `patient-${patient.id || patient._id}`,
            type: 'patient',
            entity: patientName,
            action: hospital
              ? `patient registered at ${hospital.name || hospital.hospitalName}`
              : 'patient registered',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'success'
          });
        }
      });

      // --------------------------------------------
      // ADVERTISEMENT CREATED
      // --------------------------------------------
      ads.forEach((ad) => {
        const createdAt =
          ad.createdAt ||
          ad.created_at;

        if (createdAt) {
          activities.push({
            id: `ad-${ad.id || ad._id}`,
            type: 'ad',
            entity: ad.title || 'Advertisement',
            action: 'advertisement created',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'warning'
          });
        }
      });

      // --------------------------------------------
      // AMBULANCE ADDED (with creator info)
      // --------------------------------------------
      ambulances.forEach((ambulance) => {
        const createdAt =
          ambulance.createdAt ||
          ambulance.created_at;

        if (!createdAt) return;

        const hospitalId =
          ambulance.hospitalId ||
          ambulance.hospital_id ||
          ambulance.hospital?.id;

        const hospital = hospitals.find(
          (h) => String(h.id || h._id) === String(hospitalId)
        );

        // Who added the ambulance
        const creatorId =
          ambulance.createdBy ||
          ambulance.created_by ||
          ambulance.createdById ||
          ambulance.userId ||
          ambulance.user_id;

        const creator = users.find(
          (u) => String(u.id || u._id) === String(creatorId)
        );

        const creatorName =
          ambulance.createdByName ||
          ambulance.created_by_name ||
          creator?.name ||
          'User';

        const ambulanceName =
          ambulance.vehicleNumber ||
          ambulance.registrationNumber ||
          ambulance.serviceName ||
          ambulance.name ||
          'Ambulance';

        activities.push({
          id: `ambulance-${ambulance.id || ambulance._id}`,
          type: 'ambulance',
          entity: ambulanceName,
          action: hospital
            ? `ambulance added to ${hospital.name || hospital.hospitalName} by ${creatorName}`
            : `ambulance added by ${creatorName}`,
          time: getRelativeTime(createdAt),
          createdAt,
          status: 'error'
        });
      });

      // --------------------------------------------
      // BLOOD BANK ADDED
      // --------------------------------------------
      bloodBanks.forEach((bloodBank) => {
        const createdAt =
          bloodBank.createdAt ||
          bloodBank.created_at;

        if (createdAt) {
          const hospitalId =
            bloodBank.hospitalId ||
            bloodBank.hospital_id ||
            bloodBank.hospital?.id;

          const hospital = hospitals.find(
            (h) => String(h.id || h._id) === String(hospitalId)
          );

          activities.push({
            id: `bloodbank-${bloodBank.id || bloodBank._id}`,
            type: 'bloodbank',
            entity: bloodBank.name || 'Blood Bank',
            action: hospital
              ? `blood bank added to ${hospital.name || hospital.hospitalName}`
              : 'blood bank added',
            time: getRelativeTime(createdAt),
            createdAt,
            status: 'error'
          });
        }
      });

      // --------------------------------------------
      // BLOOD DONOR ADDED
      // --------------------------------------------
      donors.forEach((donor) => {
        const createdAt =
          donor.createdAt ||
          donor.created_at ||
          donor.registeredAt;

        if (!createdAt) return;

        const donorName =
          donor.name ||
          donor.fullName ||
          `${donor.firstName || ''} ${donor.lastName || ''}`.trim() ||
          'Blood Donor';

        const hospitalId =
          donor.hospitalId ||
          donor.hospital_id ||
          donor.hospital?.id;

        const hospital = hospitals.find(
          (h) => String(h.id || h._id) === String(hospitalId)
        );

        // Who created/added the donor
        const creatorId =
          donor.createdBy ||
          donor.created_by ||
          donor.createdById ||
          donor.userId ||
          donor.user_id;

        const creator = users.find(
          (u) => String(u.id || u._id) === String(creatorId)
        );

        const creatorName =
          donor.createdByName ||
          donor.created_by_name ||
          creator?.name ||
          'User';

        activities.push({
          id: `donor-${donor.id || donor._id}`,
          type: 'donor',
          entity: donorName,
          action: hospital
            ? `blood donor added to ${hospital.name || hospital.hospitalName} by ${creatorName}`
            : `blood donor added by ${creatorName}`,
          time: getRelativeTime(createdAt),
          createdAt,
          status: 'success'
        });
      });

      // --------------------------------------------
      // USER CREATED (No hospital filter - show all users)
      // --------------------------------------------
      users.forEach((user) => {
        const createdAt =
          user.createdAt ||
          user.created_at ||
          user.registeredAt;

        if (!createdAt) return;

        activities.push({
          id: `user-${user.id || user._id}`,
          type: 'user',
          entity: user.name || 'User',
          action: 'user created',
          time: getRelativeTime(createdAt),
          createdAt,
          status: 'info'
        });
      });

      // ============================================================
      // SORT ACTIVITIES - newest first
      // ============================================================
      activities.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setRecentAppointments(appointmentsList);
      setRecentActivity(activities.slice(0, 8));
      setLoading(false);
    };

    loadData();
  }, [
    hospitalsData,
    doctorsData,
    patientsData,
    appointmentsData,
    adsData,
    staffData,
    ambulanceData,
    bloodBankData,
    usersData,
    donorsData,
    loadingHospitals,
    loadingDoctors,
    loadingPatients,
    loadingAppointments,
    loadingAds,
    loadingStaff,
    loadingAmbulance,
    loadingBloodBank,
    loadingUsers,
    loadingDonors
  ]);

  // Premium stat cards with gradients and icons
  const statCards = [
    { 
      label: 'Total Hospitals', 
      value: stats.totalHospitals, 
      icon: Building2, 
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: `${stats.activeHospitals} active`
    },
    { 
      label: 'Total Doctors', 
      value: stats.totalDoctors, 
      icon: Stethoscope, 
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: 'Medical professionals'
    },
    { 
      label: 'Total Patients', 
      value: stats.totalPatients, 
      icon: Users, 
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: 'Registered patients'
    },
    { 
      label: 'Total Appointments', 
      value: stats.totalAppointments, 
      icon: CalendarIcon, 
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: `${stats.pendingAppointments} pending`
    },
    { 
      label: 'Total Ambulances', 
      value: stats.totalAmbulances, 
      icon: Ambulance, 
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      textColor: 'text-red-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: 'Emergency fleet'
    },
    { 
      label: 'Blood Units', 
      value: stats.totalBloodUnits, 
      icon: Droplet, 
      gradient: 'from-rose-500 to-rose-600',
      bgGradient: 'from-rose-50 to-rose-100',
      textColor: 'text-rose-600',
      onClick: () => navigate('/super-admin/hospitals'),
      subtitle: 'Available units'
    },
    { 
      label: 'Active Ads', 
      value: stats.totalAds, 
      icon: Megaphone, 
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-600',
      onClick: () => navigate('/super-admin/ads'),
      subtitle: 'Live campaigns'
    },
    {
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: User,
      gradient: 'from-teal-500 to-teal-600',
      bgGradient: 'from-teal-50 to-teal-100',
      textColor: 'text-teal-600',
      onClick: () => navigate('/super-admin/hospital-users'),
      subtitle: 'Hospital staff'
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      textColor: 'text-cyan-600',
      onClick: () => navigate('/super-admin/users'),
      subtitle: 'Platform users'
    },
    {
      label: 'Blood Donors',
      value: stats.totalDonors,
      icon: Droplet,
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100',
      textColor: 'text-pink-600',
      onClick: () => navigate('/super-admin/blood-donors'),
      subtitle: 'Registered donors'
    }
  ];

  // Group stats into categories for better organization
  const primaryStats = statCards.slice(0, 4);
  const secondaryStats = statCards.slice(4, 10);

  const getActivityIcon = (type, status) => {
    const icons = {
      hospital: Building2,
      doctor: Stethoscope,
      staff: User,
      patient: Users,
      user: UserPlus,
      donor: Droplet,
      ad: Megaphone,
      ambulance: Ambulance,
      bloodbank: Droplet,
      appointment: CalendarIcon,
      category: Tag,
      specialty: Briefcase
    };
    const Icon = icons[type] || Activity;
    const colors = {
      success: 'text-emerald-500 bg-emerald-50',
      warning: 'text-amber-500 bg-amber-50',
      info: 'text-blue-500 bg-blue-50',
      error: 'text-red-500 bg-red-50'
    };
    return <Icon size={14} className={colors[status] || 'text-gray-500 bg-gray-50'} />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
      error: 'bg-red-50 text-red-700 border-red-200'
    };
    return badges[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      requested: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
      approved: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-blue-100 text-blue-700',
      done: 'bg-blue-100 text-blue-700',
      declined: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      canceled: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1C62A0] border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1C62A0] to-[#2a7fc7] p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
              <p className="mt-2 text-blue-100">Platform-wide statistics and insights at a glance</p>
            </div>
            <div className="flex items-center gap-3">
            </div>
          </div>
          
          {/* Quick stats chips */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm text-sm">
              <span className="font-semibold">{stats.totalHospitals}</span> Hospitals
            </div>
            <div className="bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm text-sm">
              <span className="font-semibold">{stats.totalDoctors}</span> Doctors
            </div>
            <div className="bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm text-sm">
              <span className="font-semibold">{stats.totalPatients}</span> Patients
            </div>
            <div className="bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm text-sm">
              <span className="font-semibold">{stats.totalAppointments}</span> Appointments
            </div>
            <div className="bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm text-sm">
              <span className="font-semibold">{stats.totalDonors}</span> Blood Donors
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5"></div>
        <div className="absolute bottom-0 left-1/2 -mb-20 h-48 w-48 rounded-full bg-white/5"></div>
      </div>

      {/* Primary Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={stat.onClick}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {(stat.value ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{stat.subtitle}</p>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-gray-400 group-hover:text-[#1C62A0] transition-colors">
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats - Compact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="group border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-gradient-to-br ${stat.gradient} p-2 text-white`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(stat.value ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Area - 3 columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Statistics - takes 1/3 */}
        <Card className="lg:col-span-1 border-0 shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Platform Analytics</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Real-time</span>
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Hospital Registration Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Hospital Activation</span>
                  <span className="text-sm font-bold text-[#1C62A0]">
                    {stats.totalHospitals > 0 ? Math.round((stats.activeHospitals / stats.totalHospitals) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#1C62A0] to-[#2a7fc7] h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalHospitals > 0 ? `${(stats.activeHospitals / stats.totalHospitals) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>{stats.activeHospitals} active</span>
                  <span>{stats.totalHospitals - stats.activeHospitals} inactive</span>
                </div>
              </div>

              {/* Appointment Status Distribution */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Appointment Status</span>
                  <span className="text-sm text-gray-500">{stats.totalAppointments} total</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden shadow-inner">
                  {stats.totalAppointments > 0 ? (
                    <>
                      <div 
                        className="bg-amber-400 h-full transition-all duration-500 hover:opacity-80" 
                        style={{ width: `${(stats.pendingAppointments / stats.totalAppointments) * 100}%` }}
                        title={`Pending: ${stats.pendingAppointments}`}
                      />
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-500 hover:opacity-80" 
                        style={{ width: `${(stats.acceptedAppointments / stats.totalAppointments) * 100}%` }}
                        title={`Accepted: ${stats.acceptedAppointments}`}
                      />
                      <div 
                        className="bg-purple-400 h-full transition-all duration-500 hover:opacity-80" 
                        style={{ width: `${(stats.completedAppointments / stats.totalAppointments) * 100}%` }}
                        title={`Completed: ${stats.completedAppointments}`}
                      />
                      <div 
                        className="bg-red-400 h-full transition-all duration-500 hover:opacity-80" 
                        style={{ width: `${(stats.declinedAppointments / stats.totalAppointments) * 100}%` }}
                        title={`Declined: ${stats.declinedAppointments}`}
                      />
                      <div 
                        className="bg-gray-300 h-full transition-all duration-500 hover:opacity-80" 
                        style={{ width: `${(stats.cancelledAppointments / stats.totalAppointments) * 100}%` }}
                        title={`Cancelled: ${stats.cancelledAppointments}`}
                      />
                    </>
                  ) : (
                    <div className="bg-gray-200 h-full w-full" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
                    {stats.pendingAppointments}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                    {stats.acceptedAppointments}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-400"></span>
                    {stats.completedAppointments}
                  </span>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{stats.totalHospitals}</p>
                    <p className="text-xs text-gray-500">Hospitals</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{stats.totalDoctors}</p>
                    <p className="text-xs text-gray-500">Doctors</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-purple-600">{stats.totalPatients}</p>
                    <p className="text-xs text-gray-500">Patients</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-teal-600">{stats.totalStaff}</p>
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================================
            Recent Appointments Section - takes 1/3
            ============================================================ */}
        <Card className="border-0 shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
                onClick={() => navigate('/super-admin/appointments')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="group p-4 rounded-xl border border-gray-100 hover:border-[#1C62A0] hover:shadow-md transition-all duration-300"
                  >
                    {/* Patient Name & Action */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {appointment.patientName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {appointment.action}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.statusLabel)}`}>
                        {appointment.statusLabel}
                      </span>
                    </div>

                    {/* Doctor */}
                    <div className="flex items-center gap-2 mt-2">
                      <Stethoscope size={14} className="text-emerald-500" />
                      <span className="text-sm text-gray-700">
                        {appointment.doctorName}
                      </span>
                    </div>

                    {/* Hospital */}
                    <div className="flex items-center gap-2 mt-1">
                      <Hospital size={14} className="text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {appointment.hospitalName}
                      </span>
                    </div>

                    {/* Relative Time */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon size={32} className="mx-auto text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No recent appointments</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ============================================================
            Recent Activity - Admin/System Actions Only (NO badges)
            ============================================================ */}
        <Card className="border-0 shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
                onClick={() => navigate('/super-admin/activity')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${getStatusBadge(activity.status)}`}>
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.entity}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                    {/* Status badge removed */}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity size={32} className="mx-auto text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions - Full width */}
      <Card className="border-0 shadow-md">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/hospitals/add')}
            >
              <Hospital size={14} className="mr-1" />
              Add Hospital
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/categories')}
            >
              <Layers size={14} className="mr-1" />
              Categories
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/specialties')}
            >
              <Briefcase size={14} className="mr-1" />
              Specialties
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/ads')}
            >
              <Megaphone size={14} className="mr-1" />
              Create Ad
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/appointments')}
            >
              <CalendarIcon size={14} className="mr-1" />
              View Appointments
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs hover:bg-[#1C62A0] hover:text-white transition-colors"
              onClick={() => navigate('/super-admin/blood-donors')}
            >
              <Droplet size={14} className="mr-1" />
              Blood Donors
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;