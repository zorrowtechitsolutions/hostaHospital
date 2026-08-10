// src/components/NotificationsPage.jsx - FIXED for staff
import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, Calendar, UserPlus, XCircle, X, Filter, RefreshCcw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetNotificationsByHospitalQuery,
  useGetNotificationsByRoleQuery,
  useMarkAllNotificationsAsReadByHospitalMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useUpdateNotificationMutation,
} from '../../../app/service/notification';
import { getHospitalId, getUserRole, getAuthUser } from '../../utils/auth';
import { showSuccessToast, showErrorToast } from '../ui/Toast';
import { Pagination } from '../ui/Pagination';
import { Button, Card, Badge } from '../ui';
import { socket } from '../../socket/socket';
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
  
  const auth = getAuthUser();
  const userRole = getUserRole();
  const hospitalId = getHospitalId();

  const getEntityId = () => {
    if (userRole === "doctor") {
      return auth?.doctorId || auth?.id;
    }
    if (userRole === "staff") {
      return auth?.staffId || auth?.id;
    }
    return null;
  };

  const entityId = getEntityId();

  // Hospital notifications - ONLY for hospital admin
  const hospitalQuery = useGetNotificationsByHospitalQuery(
    {
      hospitalId: hospitalId,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: userRole !== "hospital",
      refetchOnMountOrArgChange: true,
    }
  );

  // Role-based notifications - for doctors AND staff
  const roleQuery = useGetNotificationsByRoleQuery(
    {
      role: userRole,
      id: entityId,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: userRole !== "doctor" && userRole !== "staff",
      refetchOnMountOrArgChange: true,
    }
  );

  // Select notifications based on role
  let notifications = [];

  if (userRole === "hospital") {
    notifications = hospitalQuery.data?.data || [];
  } else if (userRole === "doctor" || userRole === "staff") {
    // Staff and doctors ONLY get their role-specific notifications
    notifications = roleQuery.data?.data || [];
  }

  const isLoading = () => {
    if (userRole === "hospital") {
      return hospitalQuery.isLoading;
    } else if (userRole === "doctor" || userRole === "staff") {
      return roleQuery.isLoading;
    }
    return false;
  };

  const error = () => {
    if (userRole === "hospital") {
      return hospitalQuery.error;
    } else if (userRole === "doctor" || userRole === "staff") {
      return roleQuery.error;
    }
    return null;
  };

  const refetch = () => {
    if (userRole === "hospital") {
      hospitalQuery.refetch();
    } else if (userRole === "doctor" || userRole === "staff") {
      roleQuery.refetch();
    }
  };

  const isFetching = hospitalQuery.isFetching || roleQuery.isFetching;

  const totalNotifications = () => {
    if (userRole === "hospital") {
      return hospitalQuery.data?.total || 0;
    } else if (userRole === "doctor" || userRole === "staff") {
      return roleQuery.data?.total || 0;
    }
    return 0;
  };

  const totalPages = () => {
    if (userRole === "hospital") {
      return hospitalQuery.data?.totalPages || 1;
    } else if (userRole === "doctor" || userRole === "staff") {
      return roleQuery.data?.totalPages || 1;
    }
    return 1;
  };

  const [markAllAsReadHospital] = useMarkAllNotificationsAsReadByHospitalMutation();
  const [markAllAsReadRole] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  const isNotificationUnread = (notification) => {
    if (userRole === "hospital") {
      return !notification.hospitalReadStatus?.[hospitalId];
    } else if (userRole === "doctor") {
      return !notification.doctorReadStatus?.[entityId];
    } else if (userRole === "staff") {
      return !notification.staffReadStatus?.[entityId];
    }
    return false;
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notification => isNotificationUnread(notification));
  };

  const unreadNotifications = getUnreadNotifications();
  const unreadCount = unreadNotifications.length;

  let filteredNotifications = [...notifications];

  if (typeFilter !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.type === typeFilter);
  }

  if (statusFilter !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => {
      const isUnread = isNotificationUnread(n);
      return statusFilter === 'read' ? !isUnread : isUnread;
    });
  }

  // Socket events
  useEffect(() => {
    const handleNotificationCreated = (data) => {
      refetch();
      showSuccessToast(data?.message || "New notification received!", 2000);
    };

    const handleNotificationRead = (data) => {
      refetch();
    };

    const handleDoctorRegistered = (data) => {
      refetch();
      showSuccessToast(`Doctor ${data?.doctorName || 'Doctor'} registered`, 2000);
    };

    const handleDoctorUpdated = (data) => {
      refetch();
      showSuccessToast(`Doctor ${data?.doctorName || 'Doctor'} updated`, 2000);
    };

    const handleDoctorDeleted = (data) => {
      refetch();
      showSuccessToast('Doctor deleted', 2000);
    };

    const handleDoctorRecovered = (data) => {
      refetch();
      showSuccessToast('Doctor recovered', 2000);
    };

    const handleDoctorPasswordReset = (data) => {
      refetch();
      showSuccessToast('Password reset completed', 2000);
    };

    const handleDoctorPasswordChanged = (data) => {
      refetch();
      showSuccessToast('Password changed successfully', 2000);
    };

    const handleDoctorPasswordChangedByAdmin = (data) => {
      refetch();
      showSuccessToast('Password changed by admin', 2000);
    };

    registerNotificationEvents({
      onNotificationCreated: handleNotificationCreated,
      onNotificationRead: handleNotificationRead,
      onDoctorRegistered: handleDoctorRegistered,
      onDoctorUpdated: handleDoctorUpdated,
      onDoctorDeleted: handleDoctorDeleted,
      onDoctorRecovered: handleDoctorRecovered,
      onDoctorPasswordReset: handleDoctorPasswordReset,
      onDoctorPasswordChanged: handleDoctorPasswordChanged,
      onDoctorPasswordChangedByAdmin: handleDoctorPasswordChangedByAdmin,
    });

    return () => {
      unregisterNotificationEvents();
    };
  }, [refetch]);

  useEffect(() => {
    const handleConnect = () => {};
    const handleDisconnect = () => {};

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      let updateBody = {};

      if (userRole === "hospital") {
        updateBody = {
          hospitalReadStatus: {
            [hospitalId]: true
          }
        };
      } else if (userRole === "doctor") {
        updateBody = {
          doctorReadStatus: {
            [entityId]: true
          }
        };
      } else if (userRole === "staff") {
        updateBody = {
          staffReadStatus: {
            [entityId]: true
          }
        };
      }

      await updateNotification({
        id: notificationId,
        body: updateBody
      }).unwrap();

      socket.emit("notification_read", {
        notificationId: notificationId,
        hospitalId: hospitalId,
        userId: entityId,
        userRole: userRole
      });

      await refetch();
      showSuccessToast("Notification marked as read", 2000);
    } catch {
      showErrorToast("Failed to mark as read", 2000);
    }
  };

  const handleNotificationClick = (notification) => {
    if (isNotificationUnread(notification)) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!unreadNotifications.length) {
        showSuccessToast("No unread notifications to mark", 2000);
        return;
      }

      const notificationIds = unreadNotifications.map(n => n.id);

      if (userRole === "hospital") {
        await markAllAsReadHospital({
          hospitalId: Number(hospitalId),
          notificationIds,
        }).unwrap();
      } else if (userRole === "doctor" || userRole === "staff") {
        await markAllAsReadRole({
          role: userRole,
          userId: entityId,
          notificationIds,
        }).unwrap();
      }

      socket.emit("notifications_read_all", {
        hospitalId: hospitalId,
        userId: entityId,
        userRole: userRole,
        count: notificationIds.length
      });

      await refetch();
      showSuccessToast(`All ${notificationIds.length} notifications marked as read`, 2000);
    } catch {
      showErrorToast("Failed to mark all as read", 2000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      showSuccessToast("Notification deleted successfully", 2000);
      refetch();
    } catch (error) {
      showErrorToast("Failed to delete notification", 2000);
    }
  };

  const handleDeleteAllClick = () => {
    if (notifications.length === 0) {
      showSuccessToast("No notifications to delete", 2000);
      return;
    }
    setSelectedNotificationId('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (selectedNotificationId === 'all') {
        const deletePromises = notifications.map(notification => 
          deleteNotification(notification.id).unwrap()
        );
        await Promise.all(deletePromises);

        socket.emit("notifications_deleted_all", {
          hospitalId: hospitalId,
          userId: entityId,
          userRole: userRole
        });

        showSuccessToast('All notifications deleted successfully', 2000);
      } else {
        await deleteNotification(selectedNotificationId).unwrap();

        socket.emit("notification_deleted", {
          notificationId: selectedNotificationId,
          hospitalId: hospitalId,
          userId: entityId,
          userRole: userRole
        });

        if (filteredNotifications.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      await refetch();
      setShowDeleteConfirm(false);
      setSelectedNotificationId(null);
    } catch (error) {
      showErrorToast('Failed to delete notification(s)', 2000);
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

  if (isLoading()) {
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
              showFilters || getActiveFilterCount() > 0 ? 'text-[#1C62A0]' : 'text-gray-500'
            } hover:bg-gray-50`}
            title="Toggle Filters"
          >
            <Filter size={16} />
            {getActiveFilterCount() > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
          {totalNotifications() > 0 && (
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
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                    {getActiveFilterCount()} Active Filter{getActiveFilterCount() !== 1 ? "s" : ""}
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
                const isUnread = isNotificationUnread(notif);
                
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notif.id);
                              }}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                              title="Delete notification"
                            >
                              <Trash2 size={18} />
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
                totalPages={totalPages()}
                onPageChange={setCurrentPage}
                totalItems={totalNotifications()}
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