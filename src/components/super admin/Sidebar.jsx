// src/components/super-admin/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Tag,
  Stethoscope,
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Hospital,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLogoutMutation } from '../../../app/service/hospitalApi';
import { tokenManager } from '../../utils/fcmTokenManager';
import { getDeviceId } from '../../utils/deviceManager';

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [logoutApi] = useLogoutMutation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
    { id: 'hospitals', label: 'Hospitals', icon: Building2, path: '/super-admin/hospitals' },
    { id: 'categories', label: 'Categories', icon: Tag, path: '/super-admin/categories' },
    { id: 'specialties', label: 'Specialties', icon: Stethoscope, path: '/super-admin/specialties' },
    { id: 'ads', label: 'Advertisements', icon: Megaphone, path: '/super-admin/ads' },
    { 
      label: 'All Users', 
      icon: Users, 
      path: '/super-admin/users',
      description: 'View and manage all users'
    },
    { 
      id: 'permission-management', 
      label: 'Permission Management', 
      icon: Shield, 
      hasDropdown: true,
      dropdownItems: [
        { 
          label: 'Super Admin Roles', 
          icon: UserCog, 
          path: '/super-admin/super-permissions',
          description: 'Manage super admin roles & permissions'
        },
        { 
          label: 'Hospital Roles', 
          icon: Hospital, 
          path: '/super-admin/hospital-users',
          description: 'Manage hospital roles & permissions'
        },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isDropdownItemActive = (dropdownItems) => dropdownItems?.some(item => location.pathname === item.path);
  const shouldKeepOpen = (dropdownItems) => dropdownItems?.some(item => location.pathname.startsWith(item.path));

  const toggleDropdown = (label) => {
    setOpenDropdowns(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    const newOpenState = {};
    menuItems.forEach(item => {
      if (item.hasDropdown && shouldKeepOpen(item.dropdownItems)) {
        newOpenState[item.label] = true;
      }
    });
    setOpenDropdowns(prev => ({ ...prev, ...newOpenState }));
  }, [location.pathname]);

  // ✅ Complete logout handler with API - EXACT FLOW
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // ✅ STEP 1: Get Super Admin data from localStorage
      let authData = {};
      let userData = {};
      
      try {
        authData = JSON.parse(localStorage.getItem('authData') || '{}');
      } catch (e) {
        console.warn('⚠️ Could not parse authData');
      }
      
      try {
        userData = JSON.parse(localStorage.getItem('userData') || '{}');
      } catch (e) {
        console.warn('⚠️ Could not parse userData');
      }
      
      // ✅ STEP 2: Get Super Admin ID from multiple sources
      let superAdminId = localStorage.getItem('superAdminId') || '';
      
      if (!superAdminId) {
        superAdminId = authData?.id || authData?.userId || userData?.id || userData?.userId || '';
      }
      
      // If still no ID, try to get from user object
      if (!superAdminId) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          superAdminId = user?.id || user?.userId || '';
        } catch (e) {
          console.warn('⚠️ Could not get userId from user');
        }
      }
      
      // ✅ STEP 3: Get deviceId from IndexedDB (primary source)
      let deviceId = null;
      try {
        const tokens = await tokenManager.getDeviceTokens();
        if (tokens && tokens.length > 0) {
          deviceId = tokens[0].deviceId;
          console.log('🔍 Super Admin Device ID from IndexedDB:', deviceId);
        }
      } catch (error) {
        console.warn('⚠️ Could not get deviceId from IndexedDB:', error);
      }
      
      // ✅ STEP 4: Fallback to localStorage if IndexedDB fails
      if (!deviceId) {
        deviceId = getDeviceId();
        console.log('🔍 Super Admin Device ID from localStorage:', deviceId);
      }
      
      // ✅ STEP 5: Log the logout request
      console.log('📤 Super Admin Logging out with:', {
        id: superAdminId,
        role: 'super_admin',
        deviceId: deviceId,
        endpoint: '/hospital/g-logout'
      });
      
      // ✅ STEP 6: Call logout API with Super Admin parameters
      // This will remove the FCM token from the backend database
      const result = await logoutApi({
        id: superAdminId,
        role: 'super_admin',
        deviceId: deviceId,
        useGlobalEndpoint: true // Super Admin always uses global endpoint
      }).unwrap();
      
      console.log('✅ Super Admin logout successful - FCM token removed from backend:', result);
      
    } catch (error) {
      console.error('❌ Super Admin logout error:', error);
      
      // ✅ Even if API fails, we still need to clear local data
      if (error?.status === 401 || error?.status === 403) {
        console.warn('⚠️ Authentication error during logout - likely already logged out');
      }
    } finally {
      // ✅ STEP 7: Clear IndexedDB (FCM tokens from local storage)
      console.log('🔍 Clearing IndexedDB...');
      try {
        await tokenManager.deleteDatabase();
        console.log('✅ IndexedDB database deleted');
      } catch (dbError) {
        console.warn('⚠️ Could not delete database:', dbError);
        try {
          await tokenManager.clearAllDeviceTokens();
          console.log('✅ IndexedDB tokens cleared');
        } catch (e) {
          console.warn('⚠️ Could not clear tokens:', e);
        }
      }
      
      // ✅ STEP 8: Clear ALL localStorage items
      console.log('🔍 Clearing Super Admin localStorage...');
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
        console.log(`  ✓ Removed: ${key}`);
      });
      console.log('✅ Super Admin localStorage cleared');
      
      // ✅ STEP 9: Clear sessionStorage
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
      
      // ✅ STEP 10: Clear any cached data
      if (window.caches) {
        try {
          const cacheNames = await caches.keys();
          cacheNames.forEach(name => {
            caches.delete(name);
          });
          console.log('✅ Caches cleared');
        } catch (e) {
          console.warn('⚠️ Could not clear caches:', e);
        }
      }
      
      // ✅ STEP 11: Auth context logout
      logout();
      console.log('✅ Auth context logout complete');
      
      // ✅ STEP 12: Close modal and redirect to login
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      navigate("/sign-in", { replace: true });
      console.log('✅ Redirected to Super Admin login page');
    }
  };

  // Color mapping for menu items to match dashboard
  const getItemColor = (id) => {
    const colors = {
      dashboard: 'from-blue-500 to-blue-600',
      hospitals: 'from-blue-500 to-blue-600',
      categories: 'from-blue-500 to-blue-600',
      specialties: 'from-blue-500 to-blue-600',
      ads: 'from-blue-500 to-blue-600',
      'all-users': 'from-teal-500 to-teal-600',
      'permission-management': 'from-violet-500 to-violet-600',
    };
    return colors[id] || 'from-blue-500 to-blue-600';
  };

  const getDropdownItemColor = (label) => {
    const colors = {
      'Super Admin Roles': 'from-violet-500 to-violet-600',
      'Hospital Roles': 'from-indigo-500 to-indigo-600',
    };
    return colors[label] || 'from-blue-500 to-blue-600';
  };

  return (
    <>
      <div className={`${isOpen ? 'w-64' : 'w-20'} bg-[#0F172A] text-white transition-all duration-300 flex flex-col shadow-2xl h-screen fixed left-0 top-0 z-20 overflow-hidden`}>
        {/* Logo Section - Enhanced */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C62A0] to-[#2a7fc7] opacity-10"></div>
          <div className="relative flex items-center justify-between p-4 border-b border-white/5">
            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center w-full'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-xl shadow-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              {isOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-sm bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Hosta Super Admin
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={onToggle} 
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden md:block"
            >
              {isOpen ? <ChevronLeft size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Menu Items - Enhanced */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActiveItem = isActive(item.path);
            const colorGradient = getItemColor(item.id);
            
            if (item.hasDropdown) {
              const isDropdownOpen = openDropdowns[item.label] || shouldKeepOpen(item.dropdownItems);
              return (
                <div key={item.id || item.label} className="mb-1">
                  <button
                    onClick={() => isOpen && toggleDropdown(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isDropdownOpen ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${isDropdownOpen ? `bg-gradient-to-r ${colorGradient}` : 'bg-white/5'}`}>
                        <Icon size={18} className={isDropdownOpen ? 'text-white' : 'text-gray-400'} />
                      </div>
                      {isOpen && (
                        <span className={`text-sm truncate ${isDropdownOpen ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {isOpen && (
                      <div className="ml-2">
                        {isDropdownOpen ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRightIcon size={16} className="text-gray-500" />
                        )}
                      </div>
                    )}
                  </button>
                  
                  {isOpen && isDropdownOpen && (
                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-white/5 pl-3">
                      {item.dropdownItems.map((subItem) => {
                        const isSubActive = isActive(subItem.path);
                        const subColor = getDropdownItemColor(subItem.label);
                        return (
                          <button
                            key={subItem.path}
                            onClick={() => navigate(subItem.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isSubActive
                                ? `bg-gradient-to-r ${subColor} text-white shadow-lg`
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                            title={subItem.description}
                          >
                            <subItem.icon size={15} />
                            <span className="truncate">{subItem.label}</span>
                            {isSubActive && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <button
                key={item.id || item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isOpen ? 'px-3 gap-3' : 'justify-center'} py-2.5 rounded-xl transition-all duration-200 group ${
                  isActiveItem
                    ? `bg-gradient-to-r ${colorGradient} text-white shadow-lg shadow-blue-500/25`
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isActiveItem ? 'bg-white/20' : 'group-hover:bg-white/10'
                }`}>
                  <Icon size={18} />
                </div>
                {isOpen && (
                  <>
                    <span className={`text-sm truncate ${isActiveItem ? 'font-medium' : ''}`}>
                      {item.label}
                    </span>
                    {isActiveItem && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout Button - Enhanced */}
        <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-sm">
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center'} py-2.5 rounded-xl text-red-400 hover:text-red-300 transition-all duration-200 hover:bg-red-500/10 group disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="p-1.5 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <LogOut size={18} className={isLoggingOut ? 'animate-pulse' : ''} />
            </div>
            {isOpen && <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal - Enhanced */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            {/* Header with gradient */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-90"></div>
              <div className="relative px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <LogOut className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
                </div>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for scrollbar and animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default Sidebar;