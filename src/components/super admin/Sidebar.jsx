// src/components/super admin/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Tag,
  Stethoscope,
  Megaphone,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  UserCog,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Hospital,
  Key,
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
    { id: 'hospitals', label: 'Hospitals', icon: Building2, path: '/super-admin/hospitals' },
    { id: 'categories', label: 'Categories', icon: Tag, path: '/super-admin/categories' },
    { id: 'specialties', label: 'Specialties', icon: Stethoscope, path: '/super-admin/specialties' },
    { id: 'ads', label: 'Advertisements', icon: Megaphone, path: '/super-admin/ads' },
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

  const handleLogout = () => {
    localStorage.clear();
    logout();
    navigate("/sign-in", { replace: true });
    setShowLogoutModal(false);
  };

  return (
    <>
      <div className={`${isOpen ? 'w-64' : 'w-20'} bg-[#111827] text-white transition-all duration-300 flex flex-col shadow-xl h-screen fixed left-0 top-0 z-20`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className={`flex items-center gap-2 ${!isOpen && 'justify-center w-full'}`}>
            <Shield className="h-8 w-8 text-[#6366F1]" />
            {isOpen && <span className="font-bold text-sm">Super Admin</span>}
          </div>
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-gray-800 hidden md:block">
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.hasDropdown) {
              const isDropdownOpen = openDropdowns[item.label] || shouldKeepOpen(item.dropdownItems);
              return (
                <div key={item.id} className="mb-1">
                  <button
                    onClick={() => isOpen && toggleDropdown(item.label)}
                    className="w-full h-12 flex items-center justify-between px-3 rounded-md text-gray-400 hover:bg-slate-700 hover:text-gray-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      {isOpen && <span className="text-sm">{item.label}</span>}
                    </div>
                    {isOpen && (isDropdownOpen ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />)}
                  </button>
                  
                  {isOpen && isDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.dropdownItems.map((subItem) => (
                        <button
                          key={subItem.path}
                          onClick={() => navigate(subItem.path)}
                          className={`w-full h-10 flex items-center gap-3 px-3 rounded-md text-sm transition ${
                            isActive(subItem.path)
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                              : 'text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                          }`}
                          title={subItem.description}
                        >
                          <subItem.icon size={16} />
                          <span className="truncate">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full h-12 flex items-center ${isOpen ? 'px-3 gap-3' : 'justify-center'} rounded-md text-sm transition ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-md text-red-400 hover:bg-red-600/20 hover:text-red-300 transition"
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="h-6 w-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition shadow-md"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add this CSS to your global styles */}
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
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Sidebar;