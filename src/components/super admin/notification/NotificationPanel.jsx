// src/components/super-admin/NotificationPanel.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Bell, Clock, CheckCircle, AlertCircle, Info, Eye, 
  Building2, User, Users, Ambulance, Droplet 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGetNotificationsByRoleQuery } from '../../../../app/service/notification';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [markingAll, setMarkingAll] = useState(false);

  // Get role ID from localStorage
  const ROLE_ID = Number(localStorage.getItem("roleId")) || 1; // Fallback to 1 if not found

  const { data: notificationsData, refetch } = useGetNotificationsByRoleQuery(
    { 
      role: 'superadmin', 
      id: ROLE_ID,  // Dynamically from localStorage
      limit: 10 
    },
    { 
      pollingInterval: 30000, 
      skip: !isOpen 
    }
  );

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hospital_registered':
      case 'hospital_updated':
        return <Building2 size={16} className="text-blue-500" />;
      case 'hospital_deleted':
        return <Building2 size={16} className="text-red-500" />;
      case 'doctor_registered':
      case 'doctor_updated':
        return <User size={16} className="text-green-500" />;
      case 'doctor_deleted':
        return <User size={16} className="text-red-500" />;
      case 'staff_registered':
      case 'staff_updated':
        return <Users size={16} className="text-purple-500" />;
      case 'staff_deleted':
        return <Users size={16} className="text-red-500" />;
      case 'ambulance_added':
      case 'ambulance_updated':
        return <Ambulance size={16} className="text-emerald-500" />;
      case 'blood_donor_registered':
        return <Droplet size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    if (type?.includes('deleted')) return 'border-l-red-500';
    if (type?.includes('registered') || type?.includes('added')) return 'border-l-green-500';
    if (type?.includes('updated')) return 'border-l-blue-500';
    return 'border-l-gray-500';
  };

  const formatTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleNotificationClick = (notification) => {
    // Mark notification as read if unread
    if (!notification.isRead) {
      // You can add mark as read logic here
      // markAsRead(notification.id);
    }
    onClose();
    navigate('/super-admin/notifications');
  };

  const handleViewAll = () => {
    onClose();
    navigate('/super-admin/notifications');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-700 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.title || 'Notification'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleViewAll}
            className="w-full py-2 text-sm font-medium text-[#154A7D] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;