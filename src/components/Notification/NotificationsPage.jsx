// src/components/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, ArrowLeft, Calendar, UserPlus, XCircle, X, Filter, RefreshCcw, CheckCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetNotificationsByHospitalQuery,
  useMarkAllNotificationsAsReadByHospitalMutation,
  useDeleteNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationsByHospitalMutation,
} from '../../../app/service/notification';
import { getHospitalId, getUserRole } from '../../utils/auth';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { Pagination } from '../ui/Pagination';
import { Button, Card, Badge } from '../ui';

// ✅ Import socket
import { socket } from '../../socket/socket';
// ✅ Import socket event listeners
import { registerNotificationEvents, unregisterNotificationEvents } from '../../socket/notificationEvents';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const hospitalId = getHospitalId();
  const userRole = getUserRole();

  const { 
    data: notificationsData, 
    isLoading, 
    error,
    refetch,
    isFetching
  } = useGetNotificationsByHospitalQuery({
    hospitalId: hospitalId,
    page: currentPage,
    limit: itemsPerPage,
  }, {
    skip: !hospitalId,
  });

  const [markAllAsRead] = useMarkAllNotificationsAsReadByHospitalMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteNotificationsByHospitalMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  let notifications = notificationsData?.data || [];
  const totalNotifications = notificationsData?.total || 0;
  const totalPages = notificationsData?.totalPages || 1;
  
  const unreadCount = notifications.filter(
    n => !n.hospitalReadStatus?.[hospitalId]
  ).length;
  
  let filteredNotifications = [...notifications];
  
  if (typeFilter !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.type === typeFilter);
  }
  
  if (statusFilter !== 'all') {
    const isReadStatus = statusFilter === 'read';
    filteredNotifications = filteredNotifications.filter(n => {
      const isUnread = !n.hospitalReadStatus?.[hospitalId];
      return statusFilter === 'read' ? !isUnread : isUnread;
    });
  }

  // ✅ Register socket event listeners
  useEffect(() => {
    console.log("🔄 Registering notification events...");
    console.log("📡 Socket connected:", socket.connected);

    registerNotificationEvents({
      onNotificationCreated: (data) => {
        console.log("🔔 NEW NOTIFICATION CREATED:", data);
        refetch();
        showSuccessToast("New notification received!", 2000);
      },
      onNotificationRead: (data) => {
        console.log("📖 NOTIFICATION READ:", data);
        refetch();
      }
    });

    return () => {
      console.log("🧹 Unregistering notification events...");
      unregisterNotificationEvents();
    };
  }, [refetch]);

  // ✅ Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket CONNECTED - Notification events will work!");
    };

    const handleDisconnect = () => {
      console.log("❌ Socket DISCONNECTED - Notification events won't work!");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // ✅ Log all socket events for debugging
  useEffect(() => {
    const handleAnyEvent = (event, ...args) => {
      console.log(`📡 ALL SOCKET EVENTS - ${event}:`, args);
    };

    socket.onAny(handleAnyEvent);

    return () => {
      socket.offAny(handleAnyEvent);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  // ✅ Mark a single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      console.log("📖 Marking notification as read:", notificationId);
      
      const response = await updateNotification({
        id: notificationId,
        body: {
          hospitalReadStatus: {
            [hospitalId]: true
          }
        }
      }).unwrap();
      
      console.log("✅ Mark as read response:", response);
      
      // ✅ Emit socket event for real-time updates
      socket.emit("notification_read", {
        notificationId: notificationId,
        hospitalId: hospitalId,
        userId: userRole
      });
      
      await refetch();
      showSuccessToast("Notification marked as read", 2000);
    } catch (error) {
      console.error("❌ Mark as read error:", error);
      showErrorToast("Failed to mark as read", 2000);
    }
  };

  // ✅ Handle notification click - marks as read if unread
  const handleNotificationClick = (notification) => {
    const isUnread = !notification.hospitalReadStatus?.[hospitalId];
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!hospitalId) return;

      const notificationIds = notifications.map(
        (notification) => notification.id
      );

      if (notificationIds.length === 0) {
        return;
      }

      await markAllAsRead({
        hospitalId: Number(hospitalId),
        notificationIds,
      }).unwrap();

      // ✅ Emit socket event for real-time updates
      socket.emit("notifications_read_all", {
        hospitalId: hospitalId,
        userId: userRole,
        count: notificationIds.length
      });

      await refetch();

      showSuccessToast("All notifications marked as read");
    } catch (error) {
      showErrorToast("Failed to mark all as read");
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation(); // ✅ Prevent notification click from firing
    setSelectedNotificationId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllClick = () => {
    setSelectedNotificationId('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (selectedNotificationId === 'all') {
        await deleteAllNotifications(hospitalId).unwrap();
        
        // ✅ Emit socket event for real-time updates
        socket.emit("notifications_deleted_all", {
          hospitalId: hospitalId,
          userId: userRole
        });
        
        showSuccessToast('All notifications deleted successfully');
        if (filteredNotifications.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        await deleteNotification(selectedNotificationId).unwrap();
        
        // ✅ Emit socket event for real-time updates
        socket.emit("notification_deleted", {
          notificationId: selectedNotificationId,
          hospitalId: hospitalId
        });
        
        if (filteredNotifications.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      await refetch();
      setShowDeleteConfirm(false);
      setSelectedNotificationId(null);
    } catch (error) {
      showErrorToast('Failed to delete notification');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const handleRefresh = () => {
    refetch();
    showSuccessToast('Notifications refreshed', 2000);
  };

  const clearAllFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return [
      typeFilter !== 'all',
      statusFilter !== 'all'
    ].filter(Boolean).length;
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success':
        return <UserPlus size={18} className="text-green-500" />;
      case 'error':
        return <XCircle size={18} className="text-red-500" />;
      case 'warning':
        return <Calendar size={18} className="text-yellow-500" />;
      default:
        return <Bell size={18} className="text-blue-500" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getTypeInfo = (type) => {
    switch(type) {
      case 'success':
        return { label: 'Booking', className: 'bg-green-100 text-green-600' };
      case 'error':
        return { label: 'Cancellation', className: 'bg-red-100 text-red-600' };
      case 'warning':
        return { label: 'Warning', className: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: 'Info', className: 'bg-blue-100 text-blue-600' };
    }
  };

  const activeFilterCount = getActiveFilterCount();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <Card className="bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <div className="text-xs text-gray-500">
            <span className="text-gray-700">Home</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Notifications</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          {/* Empty div for spacing */}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetching}>
            <RefreshCcw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={`relative p-2 border border-gray-200 rounded-md bg-white ${
              showFilters || activeFilterCount > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
            } hover:bg-gray-50`}
            title="Toggle Filters"
          >
            <Filter size={16} />
            {activeFilterCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
          {totalNotifications > 0 && (
            <Button variant="danger" onClick={handleDeleteAllClick} className="flex items-center gap-2">
              <Trash2 size={16} /> Delete All
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
                <Filter size={18} className="text-[#1C62A0]" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {activeFilterCount} Active Filter{activeFilterCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button onClick={clearAllFilters} className="text-sm font-medium text-red-500 hover:text-red-600">
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Booking</option>
              <option value="warning">Warning</option>
              <option value="error">Cancellation</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1C62A0] bg-white"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-500">
            {typeFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : "You're all caught up!"}
          </p>
          {(typeFilter !== 'all' || statusFilter !== 'all') && (
            <button onClick={clearAllFilters} className="mt-4 text-sm text-[#1C62A0] hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <Card className="flex flex-col bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              All Notifications
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{filteredNotifications.length}</span>
            </h2>
          </div>
          
          <div className="flex flex-col min-h-[420px]">
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notif) => {
                const typeInfo = getTypeInfo(notif.type);
                const isUnread = !notif.hospitalReadStatus?.[hospitalId];
                
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                      isUnread ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isUnread ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {getIcon(notif.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`text-base ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                                {notif.title}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.className}`}>
                                {typeInfo.label}
                              </span>
                              {isUnread && (
                                <Badge variant="info" size="sm" className="text-xs bg-purple-100 text-purple-700">
                                  New
                                </Badge>
                              )}
                            </div>
                            {notif.message && (
                              <p className="text-sm text-gray-500 mt-1">
                                {notif.message}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-400">
                                {formatTime(notif.createdAt)}
                              </span>
                              {!isUnread && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Eye size={12} /> Read
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* ❌ Removed Mark as read button - now clicking the notification marks it as read */}
                            <button
                              onClick={(e) => handleDeleteClick(notif.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-200 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-auto px-6 py-3 bg-white border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalNotifications}
                itemsPerPage={itemsPerPage}
                itemLabel="notifications"
              />
            </div>
          </div>
        </Card>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <button 
                  onClick={cancelDelete}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                {selectedNotificationId === 'all' 
                  ? 'Are you sure you want to delete all notifications? This action cannot be undone.'
                  : 'Are you sure you want to delete this notification? This action cannot be undone.'
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;