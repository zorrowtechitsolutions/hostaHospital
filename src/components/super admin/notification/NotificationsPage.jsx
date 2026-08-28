// src/components/super-admin/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Eye,
  Search,
  X,
  Loader2,
  AlertCircle,
  Building2,
  User,
  Users,
  Ambulance,
  Droplet,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  useGetNotificationsByRoleQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from '../../../../app/service/notification';
import { showSuccessToast, showErrorToast } from '../../ui/Toast';

// ================= PAGINATION COMPONENT =================
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, isLoading }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to{' '}
        <span className="font-medium text-gray-700">{endItem}</span> of{' '}
        <span className="font-medium text-gray-700">{totalItems}</span> notifications
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === 1 || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <span className="px-3 py-1.5 text-sm font-medium text-[#6366F1] bg-[#EEF2FF] rounded-md">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPage === totalPages || isLoading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================
const NotificationsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);
  
  const itemsPerPage = 10;

  // Get role ID from localStorage
  const ROLE_ID = Number(localStorage.getItem("roleId")) || 1;

  // Build query params
  const buildQueryParams = () => {
    const params = {
      role: 'superadmin',
      id: ROLE_ID,
      page: currentPage,
      limit: itemsPerPage,
    };

    return params;
  };

  const { 
    data: notificationsData, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useGetNotificationsByRoleQuery(buildQueryParams());

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  // Get all notifications from the response
  let allNotifications = notificationsData?.data || [];
  const totalItems = notificationsData?.total || 0;
  const totalPages = notificationsData?.totalPages || 1;

  // Apply client-side filtering for search
  const filteredNotifications = allNotifications.filter(notification => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hospital_registered':
      case 'hospital_updated':
        return <Building2 size={20} className="text-blue-500" />;
      case 'hospital_deleted':
        return <Building2 size={20} className="text-red-500" />;
      case 'doctor_registered':
      case 'doctor_updated':
        return <User size={20} className="text-green-500" />;
      case 'doctor_deleted':
        return <User size={20} className="text-red-500" />;
      case 'staff_registered':
      case 'staff_updated':
        return <Users size={20} className="text-purple-500" />;
      case 'staff_deleted':
        return <Users size={20} className="text-red-500" />;
      case 'ambulance_added':
      case 'ambulance_updated':
        return <Ambulance size={20} className="text-emerald-500" />;
      case 'blood_donor_registered':
        return <Droplet size={20} className="text-red-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    if (type?.includes('deleted')) return 'bg-red-50 border-red-200';
    if (type?.includes('registered') || type?.includes('added')) return 'bg-green-50 border-green-200';
    if (type?.includes('updated')) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getNotificationBadgeColor = (type) => {
    if (type?.includes('deleted')) return 'bg-red-100 text-red-800';
    if (type?.includes('registered') || type?.includes('added')) return 'bg-green-100 text-green-800';
    if (type?.includes('updated')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead({ 
        notificationId, 
        role: 'superadmin', 
        userId: ROLE_ID
      }).unwrap();
      refetch();
      showSuccessToast('Notification marked as read');
    } catch (error) {
      showErrorToast('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = allNotifications.filter(n => !n.isRead);
    const unreadIds = unreadNotifications.map(n => n.id);
    
    if (unreadIds.length === 0) {
      showErrorToast('No unread notifications');
      return;
    }

    setMarkingAll(true);
    try {
      await markAllAsRead({ 
        role: 'superadmin', 
        userId: ROLE_ID,
        notificationIds: unreadIds 
      }).unwrap();
      showSuccessToast(`✅ Marked ${unreadIds.length} notifications as read`);
      refetch();
    } catch (error) {
      showErrorToast('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleBack = () => {
    navigate('/super-admin/dashboard');
  };

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell size={28} className="text-[#154A7D]" />
              Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems > 0 && (
                <span>
                  {unreadCount > 0 ? (
                    <span className="text-blue-600 font-medium">{unreadCount} unread</span>
                  ) : (
                    'All caught up!'
                  )}
                  {' • '}
                  {totalItems} total notifications
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck size={18} />
                <span>Mark All as Read</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <Loader2 size={20} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#154A7D] focus:border-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="animate-spin text-[#154A7D]" />
          <span className="mt-4 text-gray-600">Loading notifications...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <div>
            <p className="text-red-700 font-medium">Error loading notifications</p>
            <p className="text-red-600 text-sm">{error.data?.message || 'Failed to load notifications. Please try again.'}</p>
            <button onClick={handleRefresh} className="mt-2 text-sm text-red-700 underline hover:text-red-900">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* No Notifications */}
      {!isLoading && !error && allNotifications.length === 0 && !searchTerm && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notifications</h3>
          <p className="text-gray-500">You're all caught up! No notifications to display.</p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && allNotifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3>
          <p className="text-gray-500">
            No notifications match your search term "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 text-[#154A7D] hover:text-[#1a5c8f] underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && filteredNotifications.length > 0 && (
        <>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getNotificationColor(
                  notification.type
                )} ${!notification.isRead ? 'ring-2 ring-blue-300' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title || 'Notification'}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getNotificationBadgeColor(notification.type)}`}>
                        {notification.type?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {!notification.isRead && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(notification.createdAt)}
                      </span>
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    {notification.isRead && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCheck size={14} />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            isLoading={isLoading || isFetching}
          />
        </>
      )}
    </div>
  );
};

export default NotificationsPage;