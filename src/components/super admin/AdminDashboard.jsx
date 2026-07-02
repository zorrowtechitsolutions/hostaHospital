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
  AlertCircle
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
    totalStaff: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
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

  const { data: ambulanceData, isLoading: loadingAmbulance } = useGetAmbulanceQuery();
  const { data: bloodBankData, isLoading: loadingBloodBank } = useGetBloodBankQuery();

  useEffect(() => {
    const loadData = async () => {
      if (loadingHospitals || loadingDoctors || loadingPatients || loadingAppointments || 
          loadingAds || loadingStaff || loadingAmbulance || loadingBloodBank) {
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
        totalStaff: staff.length
      });

      const activities = [];
      
      appointments
        .slice(0, 3)
        .forEach((appointment) => {
          const patientName = appointment.patient_name || appointment.patientName || appointment.patientName || 'Patient';
          const status = (appointment.status || appointment.booking_status || appointment.bookingStatus || 'pending').toLowerCase();
          const doctorName = appointment.displayName || appointment.doctorName || appointment.doctor_name || 'Doctor';
          
          let action = status;
          let statusType = 'info';
          
          if (status === 'pending' || status === 'requested') {
            action = 'requested appointment';
            statusType = 'warning';
          } else if (status === 'accepted' || status === 'confirmed' || status === 'approved') {
            action = 'confirmed appointment';
            statusType = 'info';
          } else if (status === 'completed' || status === 'complete') {
            action = 'completed appointment';
            statusType = 'success';
          } else if (status === 'declined' || status === 'rejected') {
            action = 'declined appointment';
            statusType = 'error';
          } else if (status === 'cancel' || status === 'cancelled') {
            action = 'cancelled appointment';
            statusType = 'error';
          }
          
          activities.push({
            id: appointment.id || appointment._id || Math.random().toString(),
            type: 'appointment',
            action: action,
            entity: `${patientName} - ${doctorName}`,
            time: appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString() : 'Recently',
            status: statusType
          });
        });

      hospitals
        .slice(0, 2)
        .forEach((hospital) => {
          activities.push({
            id: hospital.id || hospital._id || Math.random().toString(),
            type: 'hospital',
            action: 'registered',
            entity: hospital.name || hospital.hospitalName || 'Unknown Hospital',
            time: hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'Recently',
            status: 'success'
          });
        });

      setRecentActivity(activities.slice(0, 5));
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
    loadingHospitals,
    loadingDoctors,
    loadingPatients,
    loadingAppointments,
    loadingAds,
    loadingStaff,
    loadingAmbulance,
    loadingBloodBank
  ]);

  const statCards = [
    { 
      label: 'Total Hospitals', 
      value: stats.totalHospitals, 
      icon: Building2, 
      color: 'bg-blue-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Total Doctors', 
      value: stats.totalDoctors, 
      icon: Stethoscope, 
      color: 'bg-green-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Total Patients', 
      value: stats.totalPatients, 
      icon: Users, 
      color: 'bg-purple-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Total Appointments', 
      value: stats.totalAppointments, 
      icon: CalendarIcon, 
      color: 'bg-indigo-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Total Ambulances', 
      value: stats.totalAmbulances, 
      icon: Ambulance, 
      color: 'bg-red-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Blood Units', 
      value: stats.totalBloodUnits, 
      icon: Droplet, 
      color: 'bg-rose-500',
      onClick: () => navigate('/super-admin/hospitals')
    },
    { 
      label: 'Active Ads', 
      value: stats.totalAds, 
      icon: Megaphone, 
      color: 'bg-orange-500',
      onClick: () => navigate('/super-admin/ads')
    },
    {
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: User,
      color: 'bg-teal-500',
      onClick: () => navigate('/super-admin/hospital-users')
    }
  ];

  const getActivityIcon = (type, status) => {
    const icons = {
      hospital: Building2,
      category: Tag,
      specialty: Stethoscope,
      ad: Megaphone,
      appointment: CalendarIcon
    };
    const Icon = icons[type] || Activity;
    const colors = {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500',
      error: 'text-red-500'
    };
    return <Icon size={16} className={colors[status] || 'text-gray-500'} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C62A0]"></div>
          <p className="mt-3 text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide statistics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} p-2 rounded-lg bg-opacity-10`}>
                  <Icon size={20} className={stat.color.replace('bg-', 'text-')} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {(stat.value ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Statistics */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Statistics</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Hospital Registrations</span>
                <span className="font-medium">
                  {stats.totalHospitals > 0 ? Math.round((stats.activeHospitals / stats.totalHospitals) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: stats.totalHospitals > 0 ? `${(stats.activeHospitals / stats.totalHospitals) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Appointment Status Distribution</span>
                <span className="font-medium">{stats.totalAppointments} total</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                {stats.totalAppointments > 0 ? (
                  <>
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{ width: `${(stats.pendingAppointments / stats.totalAppointments) * 100}%` }}
                      title={`Pending: ${stats.pendingAppointments}`}
                    />
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${(stats.acceptedAppointments / stats.totalAppointments) * 100}%` }}
                      title={`Accepted: ${stats.acceptedAppointments}`}
                    />
                    <div 
                      className="bg-purple-500 h-full" 
                      style={{ width: `${(stats.completedAppointments / stats.totalAppointments) * 100}%` }}
                      title={`Completed: ${stats.completedAppointments}`}
                    />
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${(stats.declinedAppointments / stats.totalAppointments) * 100}%` }}
                      title={`Declined: ${stats.declinedAppointments}`}
                    />
                    <div 
                      className="bg-gray-400 h-full" 
                      style={{ width: `${(stats.cancelledAppointments / stats.totalAppointments) * 100}%` }}
                      title={`Cancelled: ${stats.cancelledAppointments}`}
                    />
                  </>
                ) : (
                  <div className="bg-gray-200 h-full w-full" />
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Doctor Coverage</span>
                <span className="font-medium">
                  {stats.totalDoctors > 0 && stats.totalHospitals > 0 ? Math.round((stats.totalDoctors / stats.totalHospitals) * 10) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: stats.totalDoctors > 0 && stats.totalHospitals > 0 ? `${Math.min((stats.totalDoctors / stats.totalHospitals) * 10, 100)}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>System Utilization</span>
                <span className="font-medium">
                  {stats.totalHospitals > 100 ? '85%' : stats.totalHospitals > 50 ? '65%' : '45%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: stats.totalHospitals > 100 ? '85%' : stats.totalHospitals > 50 ? '65%' : '45%' }}
                />
              </div>
            </div>
          </div>

          {/* Appointment Status Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-3">Appointment Status Breakdown</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-yellow-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ClockIcon size={14} className="text-yellow-600" />
                  <p className="text-sm font-semibold text-yellow-600">{stats.pendingAppointments}</p>
                </div>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle size={14} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-600">{stats.acceptedAppointments}</p>
                </div>
                <p className="text-xs text-gray-600">Accepted</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Activity size={14} className="text-purple-600" />
                  <p className="text-sm font-semibold text-purple-600">{stats.completedAppointments}</p>
                </div>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle size={14} className="text-red-600" />
                  <p className="text-sm font-semibold text-red-600">{stats.declinedAppointments}</p>
                </div>
                <p className="text-xs text-gray-600">Declined</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle size={14} className="text-gray-600" />
                  <p className="text-sm font-semibold text-gray-600">{stats.cancelledAppointments}</p>
                </div>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-3">Quick Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalHospitals}</p>
                <p className="text-xs text-gray-600">Total Hospitals</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalDoctors}</p>
                <p className="text-xs text-gray-600">Total Doctors</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.totalPatients}</p>
                <p className="text-xs text-gray-600">Total Patients</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.totalStaff}</p>
                <p className="text-xs text-gray-600">Total Staff</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/super-admin/hospitals')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{activity.entity}</span>
                      <span className="text-gray-500"> was {activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm"
                onClick={() => navigate('/super-admin/hospitals/add')}
              >
                Add Hospital
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm"
                onClick={() => navigate('/super-admin/categories')}
              >
                View Categories
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm"
                onClick={() => navigate('/super-admin/specialties')}
              >
                Manage Specialties
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm"
                onClick={() => navigate('/super-admin/ads')}
              >
                Create Ad
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;