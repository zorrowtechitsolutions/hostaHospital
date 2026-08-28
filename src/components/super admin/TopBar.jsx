// src/components/super-admin/TopBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Maximize2, Minimize2, Menu
} from 'lucide-react';
import NotificationPanel from './notification/NotificationPanel';
import { useGetNotificationsByRoleQuery } from '../../../app/service/notification';

// Get super admin ID from localStorage or auth context
const SUPER_ADMIN_ID = Number(localStorage.getItem("roleId")) || 1;

const TopBar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notificationRef = useRef(null);

  // Fetch notifications with a higher limit to get accurate unread count
  // You can either:
  // Option 1: Fetch all notifications (if total is manageable)
  // Option 2: Fetch with a large limit and count unread
  const { data: notificationsData, refetch } = useGetNotificationsByRoleQuery(
    { 
      role: 'superadmin', 
      id: SUPER_ADMIN_ID,
      limit: 50, // Increase limit to get more notifications for accurate count
      page: 1
    },
    { pollingInterval: 30000 }
  );

  const notifications = notificationsData?.data || [];
  const totalUnreadCount = notificationsData?.unreadCount || 0; // If your API returns total unread count
  
  // Calculate unread count from fetched notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Use totalUnreadCount from API if available, otherwise use calculated count
  const displayUnreadCount = totalUnreadCount || unreadCount;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      refetch();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleClickOutside = (event) => {
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
        
        <div className="hidden md:block">
          <h1 className="text-white font-semibold text-sm">Super Admin</h1>
        </div>
      </div>

      {/* Right side - Fullscreen and Notifications */}
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
            onClick={handleNotificationClick}
            className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Toggle notifications"
          >
            <Bell size={20} className="!text-white" stroke="white" />
            {displayUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-medium">
                {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
              </span>
            )}
          </button>

          <NotificationPanel 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;