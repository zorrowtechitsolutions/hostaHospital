// src/components/layout/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, Maximize2, Minimize2, Menu,
  UserCheck, Settings, LogOut, Bell as BellIcon
} from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { useLogoutMutation } from '../../app/service/hospitalApi';
import { useGetHospitalByIdQuery } from '../../app/service/hospitalApi';
import { useGetDoctorByIdQuery } from '../../app/service/doctorApi';
import { useGetStaffByIdQuery } from '../../app/service/staffApi';
import {
  useGetNotificationsByRoleQuery,
  useToggleNotificationStatusMutation
} from "../../app/service/notification";
import { getHospitalId } from "../utils/auth";
import { getS3ImageUrl } from '../../app/service/S3';
import { tokenManager } from '../utils/fcmTokenManager';
import { getDeviceId } from '../utils/deviceManager';
import { initSocket, socket } from '../socket/socket';
import { registerHospitalEvents, unregisterHospitalEvents } from '../socket/hospitalEvents';
import { registerDoctorEvents, unregisterDoctorEvents } from '../socket/doctorEvents';
import { registerStaffEvents, unregisterStaffEvents } from '../socket/staffEvents';

// ================= HELPER FUNCTIONS =================

const getImageUrlWithCache = async (imageUrl) => {
  if (!imageUrl) return null;

  if (typeof imageUrl === 'object') {
    imageUrl =
      imageUrl.key ||
      imageUrl.url ||
      imageUrl.imageUrl ||
      imageUrl.Location ||
      null;
  }

  if (typeof imageUrl !== 'string') return null;

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:')
  ) {
    return imageUrl;
  }

  const url = await getS3ImageUrl(imageUrl);

  return url || null;
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

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

  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const [notificationEnabled, setNotificationEnabled] = useState(
    user?.notificationEnabled ?? true
  );

  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [
    toggleNotificationStatus,
    { isLoading: isTogglingNotification }
  ] = useToggleNotificationStatusMutation();

  const userRole = user?.role || 'hospital';

  // ================= ID LOGIC =================
  const hospitalId = Number(
    user?.hospitalId ||
    localStorage.getItem("hospitalId") ||
    getHospitalId()
  );

  const userId =
    userRole === "doctor"
      ? Number(localStorage.getItem("doctorId") || user?.doctorId || user?.id)
      : userRole === "staff"
      ? Number(localStorage.getItem("staffId") || user?.staffId || user?.id)
      : hospitalId;
  // ================= END ID LOGIC =================

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

  // ================= NOTIFICATION LOGIC =================
  const notificationRole =
    userRole === "super_admin" ? "superadmin" : userRole;

  const {
    data: notificationResponse,
    refetch: refetchNotifications,
  } = useGetNotificationsByRoleQuery(
    {
      role: notificationRole,
      id: userId,
      page: 1,
      limit: 100,
    },
    {
      skip: !notificationRole || !userId,
      pollingInterval: 10000,
    }
  );

  const notifications = Array.isArray(notificationResponse?.data)
    ? notificationResponse.data
    : notificationResponse?.data?.rows || [];

  const unreadCount = notifications.filter((notification) => {
    const statusField = {
      hospital: "hospitalReadStatus",
      doctor: "doctorReadStatus",
      staff: "staffReadStatus",
      user: "userReadStatus",
      pharmacy: "pharmacyReadStatus",
      lab: "labReadStatus",
      superadmin: "superAdminReadStatus",
    }[notificationRole];

    return statusField
      ? notification[statusField]?.[String(userId)] !== true
      : false;
  }).length;
  // ================= END NOTIFICATION LOGIC =================

  useEffect(() => {
    setNotificationEnabled(user?.notificationEnabled ?? true);
  }, [user?.notificationEnabled]);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const getProfileData = () => {
    if (userRole === 'doctor' && doctorData) {
      const doctor = doctorData.data || doctorData;

      const profileImage = doctor?.profilePicture || doctor?.profileImage || doctor?.imageUrl || doctor?.image || user?.profilePicture || storedUser?.profilePicture || null;

      const doctorName =
        doctor?.doctorName ||
        doctor?.displayName ||
        doctor?.name ||
        (doctor?.firstName && doctor?.lastName ? `${doctor.firstName} ${doctor.lastName}`.trim() : null) ||
        (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
        user?.name ||
        storedUser?.name ||
        "Doctor";

      return {
        name: doctorName,
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

      const staffName =
        staff?.staffName ||
        staff?.displayName ||
        staff?.name ||
        (staff?.firstName && staff?.lastName ? `${staff.firstName} ${staff.lastName}`.trim() : null) ||
        (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
        user?.name ||
        storedUser?.name ||
        "Staff";

      return {
        name: staffName,
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

    const hospitalName =
      hospital?.displayName ||
      hospital?.name ||
      hospital?.hospitalName ||
      user?.name ||
      user?.hospitalName ||
      storedUser?.name ||
      storedUser?.hospitalName ||
      'Hospital';

    return {
      name: hospitalName,
      email: user?.email || hospital?.email || storedUser?.email || '',
      profileImage: profileImage,
      role: 'hospital',
      roleLabel: 'Hospital Admin',
      id: hospital?.id || userId
    };
  };

  const profileData = getProfileData();
  const isLoading = isHospitalLoading || isDoctorLoading || isStaffLoading;

  useEffect(() => {
    let isMounted = true;

    const loadProfileImage = async () => {
      const image = profileData.profileImage;

      if (!image) {
        if (isMounted) setProfileImageUrl(null);
        return;
      }

      const url = await getImageUrlWithCache(image);

      if (isMounted) {
        setProfileImageUrl(url);
      }
    };

    loadProfileImage();

    return () => {
      isMounted = false;
    };
  }, [profileData.profileImage]);

  const initials = getInitials(profileData.name);
  const gradientColor = getColorFromName(profileData.name);

  useEffect(() => {
    setImageError(false);
    setMenuImageError(false);
  }, [profileImageUrl]);

  const handleNotificationToggle = async () => {
    try {
      const response = await toggleNotificationStatus().unwrap();
      setNotificationEnabled(response.notificationEnabled);
    } catch (error) {
      console.error("Failed to update notification status:", error);
      setNotificationEnabled(prev => !prev);
    }
  };

  // SOCKET INTEGRATION
  useEffect(() => {
    const socketInstance = initSocket();

    const eventHandlers = {
      onHospitalRegistered: () => {},
      onHospitalUpdated: () => {},
      onHospitalDeleted: () => {},
      onHospitalBlacklisted: () => {},
      onHospitalRecovered: () => {},
      onDoctorRegistered: () => {},
      onDoctorUpdated: () => {},
      onDoctorDeleted: () => {},
      onDoctorRecovered: () => {},
      onDoctorPasswordReset: () => {},
      onDoctorPasswordChanged: () => {},
      onStaffRegistered: () => {},
      onStaffUpdated: () => {},
      onStaffDeleted: () => {},
      onStaffRecovered: () => {},
      onStaffPasswordReset: () => {},
      onStaffPasswordChanged: () => {}
    };

    if (userRole === 'hospital') {
      registerHospitalEvents(eventHandlers);
    } else if (userRole === 'doctor') {
      registerDoctorEvents(eventHandlers);
    } else if (userRole === 'staff') {
      registerStaffEvents(eventHandlers);
    }

    if (userId) {
      const room = userRole === 'hospital' ? `hospital_${userId}` :
                   userRole === 'doctor' ? `doctor_${userId}` :
                   `staff_${userId}`;
      socket.emit('join-room', room);
    }

    return () => {
      if (userRole === 'hospital') {
        unregisterHospitalEvents();
      } else if (userRole === 'doctor') {
        unregisterDoctorEvents();
      } else if (userRole === 'staff') {
        unregisterStaffEvents();
      }

      if (userId) {
        const room = userRole === 'hospital' ? `hospital_${userId}` :
                     userRole === 'doctor' ? `doctor_${userId}` :
                     `staff_${userId}`;
        socket.emit('leave-room', room);
      }

      socket.disconnect();
    };
  }, [userRole, userId]);

  useEffect(() => {
    const handleReconnect = () => {
      if (userId) {
        const room = userRole === 'hospital' ? `hospital_${userId}` :
                     userRole === 'doctor' ? `doctor_${userId}` :
                     `staff_${userId}`;
        socket.emit('join-room', room);
      }
    };

    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('reconnect', handleReconnect);
    };
  }, [userId, userRole]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const storedUserRole = localStorage.getItem('userRole') || 'hospital';
      const storedHospitalId = localStorage.getItem('hospitalId') || '';

      let logoutUserId = profileData.id || authData?.id || authData?.userId || authData?.hospitalId || '';

      if (!logoutUserId) {
        logoutUserId = userData?.id || userData?.hospitalId || userData?.doctorId || userData?.staffId || '';
      }

      if (!logoutUserId) {
        logoutUserId = storedHospitalId;
      }

      const role = userRole || storedUserRole || 'hospital';

      let deviceId = null;
      try {
        const tokens = await tokenManager.getDeviceTokens();
        if (tokens && tokens.length > 0) {
          deviceId = tokens[0].deviceId;
        }
      } catch (error) {
        // Could not get deviceId from IndexedDB
      }

      if (!deviceId) {
        deviceId = getDeviceId();
      }

      const isSuperAdmin = role === 'super_admin';

      const logoutParams = {
        id: logoutUserId,
        role: role,
        deviceId: deviceId,
        useGlobalEndpoint: isSuperAdmin
      };

      if (!isSuperAdmin && storedHospitalId) {
        logoutParams.hospitalId = storedHospitalId;
      }

      await logoutApi(logoutParams).unwrap();

    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        // Authentication error during logout - likely already logged out
      }
    } finally {
      try {
        await tokenManager.deleteDatabase();
      } catch (dbError) {
        try {
          await tokenManager.clearAllDeviceTokens();
        } catch (e) {
          // Could not clear tokens
        }
      }

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

      sessionStorage.clear();

      if (window.caches) {
        try {
          const cacheNames = await caches.keys();
          cacheNames.forEach(name => {
            caches.delete(name);
          });
        } catch (e) {
          // Could not clear caches
        }
      }

      logout();
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
              <span className="absolute -top-0.5 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 999 ? '999+' : unreadCount}
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
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#1a2332] border border-slate-600">
              {isLoading ? (
                <div className="w-full h-full animate-pulse bg-slate-700"></div>
              ) : profileImageUrl && !imageError ? (
                <img
                  src={profileImageUrl}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                  onError={() => {
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

                {/* Notification Toggle */}
                <div className="w-full px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellIcon size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Notifications
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    disabled={isTogglingNotification}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      notificationEnabled
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    } ${
                      isTogglingNotification
                        ? "opacity-50 cursor-wait"
                        : "cursor-pointer"
                    }`}
                    aria-label={
                      notificationEnabled
                        ? "Turn notifications off"
                        : "Turn notifications on"
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                        notificationEnabled
                          ? "translate-x-4"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Show Settings ONLY for Hospital Admin */}
                {userRole === 'hospital' && (
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