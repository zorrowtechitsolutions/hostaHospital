// src/components/super-admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Tag,
  Stethoscope,
  Megaphone,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock,
  Ambulance,
  Droplet,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { useGetAllHospitalsQuery } from '../../../app/service/hospitalApi';
import { useGetDoctorsQuery } from '../../../app/service/doctorApi';
import { useGetBookingsQuery } from '../../../app/service/request';
import { useGetAdsQuery } from '../../../app/service/ads';
import { useGetAmbulanceQuery } from '../../../app/service/ambulance';
import { useGetBloodBankQuery } from '../../../app/service/bloodbank';
import { useGetPatientsQuery } from '../../../app/service/patients';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalAmbulances: 0,
    totalBloodUnits: 0,
    totalAds: 0,
    pendingApprovals: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from APIs
  const { data: hospitalsData, isLoading: loadingHospitals } = useGetAllHospitalsQuery();
  const { data: doctorsData, isLoading: loadingDoctors } = useGetDoctorsQuery({
    page: 1,
    limit: 1000
  });
  const { data: patientsData, isLoading: loadingPatients } = useGetPatientsQuery({
    page: 1,
    limit: 1000
  });
  const { data: appointmentsData, isLoading: loadingAppointments } = useGetBookingsQuery({
    page: 1,
    limit: 1000
  });
  const { data: adsData, isLoading: loadingAds } = useGetAdsQuery({
    page: 1,
    limit: 1000
  });
  const { data: ambulanceData, isLoading: loadingAmbulance } = useGetAmbulanceQuery({});
  const { data: bloodBankData, isLoading: loadingBloodBank } = useGetBloodBankQuery({});

  // Calculate dashboard stats from real data
  useEffect(() => {
    if (loadingHospitals || loadingDoctors || loadingPatients || loadingAppointments || loadingAds || loadingAmbulance || loadingBloodBank) {
      return;
    }

    // Extract data from responses
    const hospitals = hospitalsData?.data || hospitalsData || [];
    const doctors = doctorsData?.data?.rows || doctorsData?.data || doctorsData?.doctors || [];
    const patients = patientsData?.data || [];
    const appointments = appointmentsData?.data || [];
    const ads = adsData?.data || adsData?.ads || [];
    const ambulances = ambulanceData?.data || [];
    
    // Calculate total blood units
    const bloodBanks = bloodBankData?.data || [];
    const totalBloodUnits = bloodBanks.reduce((sum, item) => sum + (item.count || 0), 0);

    setStats({
      totalHospitals: hospitals.length,
      activeHospitals: hospitals.filter(h => h.status === 'active' || h.isActive === true).length,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      totalAmbulances: ambulances.length,
      totalBloodUnits: totalBloodUnits,
      totalAds: ads.length,
      pendingApprovals: hospitals.filter(h => h.status === 'pending' || h.isActive === false).length
    });

    // Generate recent activity from latest hospitals
    const activities = hospitals
      .slice(0, 5)
      .map((hospital) => ({
        id: hospital.id,
        type: 'hospital',
        action: 'registered',
        entity: hospital.name,
        time: hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'Recently',
        status: 'success'
      }));

    setRecentActivity(activities);
    setLoading(false);
  }, [
    hospitalsData,
    doctorsData,
    patientsData,
    appointmentsData,
    adsData,
    ambulanceData,
    bloodBankData,
    loadingHospitals,
    loadingDoctors,
    loadingPatients,
    loadingAppointments,
    loadingAds,
    loadingAmbulance,
    loadingBloodBank
  ]);

  // Updated stat cards with real data
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
      label: 'Pending Approvals', 
      value: stats.pendingApprovals, 
      icon: Clock, 
      color: 'bg-yellow-500',
      onClick: () => navigate('/super-admin/hospitals')
    }
  ];

  const getActivityIcon = (type, status) => {
    const icons = {
      hospital: Building2,
      category: Tag,
      specialty: Stethoscope,
      ad: Megaphone
    };
    const Icon = icons[type] || Activity;
    const colors = {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
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
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
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
                ></div>
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
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Appointment Fulfillment</span>
                <span className="font-medium">-</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
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
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-3">Quick Summary</h3>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.totalAppointments}</p>
                <p className="text-xs text-gray-600">Appointments</p>
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
          <div className="space-y-4">
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