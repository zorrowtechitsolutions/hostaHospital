// src/components/layout/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, ChevronDown, Maximize2, Minimize2, Menu, 
  UserCheck, Settings, LogOut
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { useLogoutMutation } from '../../app/service/hospitalApi';
import { useGetHospitalByIdQuery } from '../../app/service/hospitalApi';
import { useGetDoctorByIdQuery } from '../../app/service/doctorApi';
import { useGetStaffByIdQuery } from '../../app/service/staffApi';
import {
  useGetNotificationsByHospitalQuery
} from "../../app/service/notification";
import { getHospitalId } from "../utils/auth";
import { getS3ImageUrl } from '../../app/service/S3';
import { tokenManager } from '../utils/fcmTokenManager';
import { getDeviceId } from '../utils/deviceManager';

// ================= HELPER FUNCTIONS =================

// Get S3 image URL with cache busting
const getImageUrlWithCache = (imageUrl) => {
  if (!imageUrl) return null;
  const url = getS3ImageUrl(imageUrl);
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

// Generate a consistent color from a string
const getColorFromName = (name) => {
  if (!name) return 'from-blue-500 to-purple-500';
  
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get user role label
const getRoleLabel = (role) => {
  const roleMap = {
    'hospital': 'Hospital Admin',
    'doctor': 'Doctor',
    'staff': 'Staff',
    'super_admin': 'Super Admin'
  };
  return roleMap[role] || role || 'User';
};

const TopBar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [menuImageError, setMenuImageError] = useState(false);
  
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  const hospitalId = getHospitalId();
  const userRole = user?.role || 'hospital';
  
  // ✅ Check if user is Hospital Admin (has access to Settings)
  const isHospitalAdmin = userRole === 'hospital';
  
  // Get user ID based on role
  const userId = user?.id || user?.hospitalId || user?.doctorId || user?.staffId || hospitalId;
  
  // Fetch data based on user role
  const { data: hospitalData, isLoading: isHospitalLoading } = useGetHospitalByIdQuery(
    userId,
    { skip: userRole !== 'hospital' || !userId }
  );
  
  const { data: doctorData, isLoading: isDoctorLoading } = useGetDoctorByIdQuery(
    userId,
    { skip: userRole !== 'doctor' || !userId }
  );
  
  const { data: staffData, isLoading: isStaffLoading } = useGetStaffByIdQuery(
    userId,
    { skip: userRole !== 'staff' || !userId }
  );
  
  const { data: notificationsData } = useGetNotificationsByHospitalQuery(
    { hospitalId },
    { skip: !hospitalId, pollingInterval: 10000 }
  );
  
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Determine which data source to use based on role
  const getProfileData = () => {
    if (userRole === 'doctor' && doctorData) {
      const doctor = doctorData.data || doctorData;
      const profileImage = doctor?.profilePicture || doctor?.profileImage || doctor?.imageUrl || doctor?.image || user?.profilePicture || storedUser?.profilePicture || null;
      return {
        name: doctor?.name || doctor?.firstName + ' ' + doctor?.lastName || user?.name || storedUser?.name || 'Doctor',
        email: doctor?.email || user?.email || storedUser?.email || '',
        profileImage: profileImage,
        role: 'doctor',
        roleLabel: 'Doctor',
        id: doctor?.id || userId
      };
    }
    
    if (userRole === 'staff' && staffData) {
      const staff = staffData.data || staffData;
      const profileImage = staff?.profilePicture || staff?.profileImage || staff?.imageUrl || staff?.image || user?.profilePicture || storedUser?.profilePicture || null;
      return {
        name: staff?.name || user?.name || storedUser?.name || 'Staff',
        email: staff?.email || user?.email || storedUser?.email || '',
        profileImage: profileImage,
        role: 'staff',
        roleLabel: 'Staff',
        id: staff?.id || userId
      };
    }
    
    // Default: Hospital
    const hospital = hospitalData?.data || hospitalData;
    const profileImage = hospital?.profilePicture || hospital?.profileImage || hospital?.imageUrl || hospital?.image || user?.profilePicture || storedUser?.profilePicture || null;
    return {
      name: user?.name || user?.hospitalName || hospital?.name || storedUser?.name || storedUser?.hospitalName || 'Hospital',
      email: user?.email || hospital?.email || storedUser?.email || '',
      profileImage: profileImage,
      role: 'hospital',
      roleLabel: 'Hospital Admin',
      id: hospital?.id || userId
    };
  };
  
  const profileData = getProfileData();
  const isLoading = isHospitalLoading || isDoctorLoading || isStaffLoading;
  
  // ✅ Get profile image URL with proper handling
  const getProfileImageUrl = () => {
    if (!profileData.profileImage) return null;
    const url = getImageUrlWithCache(profileData.profileImage);
    return url;
  };
  
  const profileImageUrl = getProfileImageUrl();
  const initials = getInitials(profileData.name);
  const gradientColor = getColorFromName(profileData.name);
  
  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(
    (n) => !n.hospitalReadStatus?.[hospitalId]
  ).length;

  // ✅ Reset image error when profileImageUrl changes
  useEffect(() => {
    setImageError(false);
    setMenuImageError(false);
  }, [profileImageUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ✅ COMPLETE LOGOUT HANDLER - Works for all roles (Hospital, Doctor, Staff, Super Admin)
  const handleLogout = async () => {
    try {
      // ✅ 1. Get user information from multiple sources
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const storedUserRole = localStorage.getItem('userRole') || 'hospital';
      const storedHospitalId = localStorage.getItem('hospitalId') || '';
      
      // ✅ 2. Determine user ID (priority: params > authData > userData > hospitalId)
      let userId = profileData.id || authData?.id || authData?.userId || authData?.hospitalId || '';
      
      if (!userId) {
        userId = userData?.id || userData?.hospitalId || userData?.doctorId || userData?.staffId || '';
      }
      
      if (!userId) {
        userId = storedHospitalId;
      }
      
      // ✅ 3. Determine user role (priority: params > localStorage > default)
      const role = userRole || storedUserRole || 'hospital';
      
      // ✅ 4. Get deviceId from IndexedDB (primary source)
      let deviceId = null;
      try {
        const tokens = await tokenManager.getDeviceTokens();
        if (tokens && tokens.length > 0) {
          deviceId = tokens[0].deviceId;
        }
      } catch (error) {
        console.warn('⚠️ Could not get deviceId from IndexedDB:', error);
      }
      
      // ✅ 5. Fallback to localStorage if IndexedDB fails
      if (!deviceId) {
        deviceId = getDeviceId();
      }
      
      // ✅ 6. Check if this is a Super Admin
      const isSuperAdmin = role === 'super_admin';
      
      // ✅ 7. Log the logout request
      console.log('📤 Logging out with:', {
        id: userId,
        role: role,
        deviceId: deviceId,
        isSuperAdmin: isSuperAdmin,
        endpoint: isSuperAdmin ? '/hospital/g-logout' : '/hospital/logout/' + storedHospitalId
      });
      
      // ✅ 8. Call logout API with proper parameters
      const logoutParams = {
        id: userId,
        role: role,
        deviceId: deviceId,
        useGlobalEndpoint: isSuperAdmin // Super Admin uses global endpoint
      };
      
      // If not Super Admin, we can also pass the hospitalId
      if (!isSuperAdmin && storedHospitalId) {
        logoutParams.hospitalId = storedHospitalId;
      }
      
      const result = await logoutApi(logoutParams).unwrap();
      
    } catch (error) {
      console.error('❌ Logout API error:', error);
      
      // ✅ Even if API fails, we still need to clear local data
      // Check if it's a network error or authentication error
      if (error?.status === 401 || error?.status === 403) {
        console.warn('⚠️ Authentication error during logout - likely already logged out');
      }
    } finally {
      // ✅ 9. Clear IndexedDB (FCM tokens)
      try {
        await tokenManager.deleteDatabase();
      } catch (dbError) {
        console.warn('⚠️ Could not delete database:', dbError);
        // Try to clear tokens individually
        try {
          await tokenManager.clearAllDeviceTokens();
        } catch (e) {
          console.warn('⚠️ Could not clear tokens:', e);
        }
      }
      
      // ✅ 10. Clear ALL localStorage items
      const localStorageItems = [
        'accessToken',
        'refreshToken',
        'roleId',
        'userRole',
        'userData',
        'authData',
        'permissions',
        'deviceId',
        'hospitalId',
        'hospitalInfo',
        'superAdminId',
        'doctorId',
        'staffId',
        'staffNumericId',
        'user',
        'token',
        'refresh_token',
        'profilePicture',
        'userImage'
      ];
      
      localStorageItems.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // ✅ 11. Clear sessionStorage
      sessionStorage.clear();
      
      // ✅ 12. Clear any cached data
      if (window.caches) {
        try {
          const cacheNames = await caches.keys();
          cacheNames.forEach(name => {
            caches.delete(name);
          });
        } catch (e) {
          console.warn('⚠️ Could not clear caches:', e);
        }
      }
      
      // ✅ 13. Auth context logout
      logout();
      
      // ✅ 14. Redirect to login
      navigate("/sign-in", { replace: true });
    }
  };

  const handleSettings = () => {
    setShowProfileMenu(false);
    navigate("/settings");
  };

  const handleProfile = () => {
    setShowProfileMenu(false);
    navigate("/profile");
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[#0f172a] border-b border-slate-700 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      {/* Left side - Menu button */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-slate-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} className="!text-white" stroke="white" />
        </button>
      </div>

      {/* Right side - Fullscreen, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 size={20} className="!text-white" stroke="white" />
          ) : (
            <Maximize2 size={20} className="!text-white" stroke="white" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Toggle notifications"
          >
            <Bell size={20} className="!text-white" stroke="white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg transition-colors hover:bg-slate-700"
            aria-label="Toggle profile menu"
          >
            {/* Profile Image or Initials */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#1a2332] border border-slate-600">
              {isLoading ? (
                <div className="w-full h-full animate-pulse bg-slate-700"></div>
              ) : profileImageUrl && !imageError ? (
                <img 
                  src={profileImageUrl}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.warn('⚠️ Image failed to load:', profileImageUrl);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${gradientColor} flex items-center justify-center`}>
                  <span className="text-white font-medium text-xs">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-white truncate max-w-[160px]">
                {profileData.name}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                {profileData.roleLabel}
              </p>
            </div>
            <ChevronDown size={16} className="!text-white hidden lg:block" stroke="white" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              {/* Profile Header with Image or Initials */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                  {isLoading ? (
                    <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-600"></div>
                  ) : profileImageUrl && !menuImageError ? (
                    <img 
                      src={profileImageUrl}
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn('⚠️ Image failed to load in menu:', profileImageUrl);
                        setMenuImageError(true);
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${gradientColor} flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {profileData.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profileData.roleLabel}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {profileData.email}
                  </p>
                </div>
              </div>
              <div className="py-2">
                <button 
                  onClick={handleProfile}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <UserCheck size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>My Profile</span>
                </button>
                
                {/* ✅ Show Settings ONLY for Hospital Admin */}
                {isHospitalAdmin && (
                  <button 
                    onClick={handleSettings}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>Settings</span>
                  </button>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={16} className="text-red-500 dark:text-red-400" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;