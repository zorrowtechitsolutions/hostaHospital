// src/components/super-admin/TopBar.jsx
import React, { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('Super Admin');
  const [userInitial, setUserInitial] = useState('S');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const user = JSON.parse(authData);
        if (user.name) {
          setUserName(user.name);
          setUserInitial(user.name.charAt(0).toUpperCase());
        }
      } catch (error) {
        // Silently handle parse error
      }
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('roleId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      localStorage.removeItem('authData');
      localStorage.removeItem('permissions');
      localStorage.removeItem('hospitalInfo');
      localStorage.removeItem('doctorId');
      localStorage.removeItem('staffId');
      localStorage.removeItem('superAdminId');
      
      logout();
      navigate("/sign-in", { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
  };

  return (
    <div className="bg-white h-20 px-8 flex items-center justify-between border-b border-gray-200">
      {/* Search Bar - Left Side */}
      <form onSubmit={handleSearch} className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search something..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl w-72 outline-none focus:ring-2 focus:ring-[#6366F1] focus:bg-white transition-all"
        />
      </form>

      {/* Right Side - Notification and User Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors relative">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#6366F1] text-white flex items-center justify-center font-semibold">
            {userInitial}
          </div>
          <div className="hidden md:block">
            <p className="font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;