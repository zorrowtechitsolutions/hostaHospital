// src/components/layout/NotificationPanel.jsx - FIXED for staff
import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetNotificationsByHospitalQuery,
  useGetNotificationsByRoleQuery,
  useMarkAllNotificationsAsReadByHospitalMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useUpdateNotificationMutation,
} from '../../app/service/notification';
import { showSuccessToast, showErrorToast } from '../components/ui/Toast';
import { socket } from '../socket/socket';
import { registerNotificationEvents, unregisterNotificationEvents } from '../socket/notificationEvents';
import {
  getHospitalId,
  getUserRole,
  getAuthUser,
} from "../utils/auth";

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [eventsRegistered, setEventsRegistered] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  
  const auth = getAuthUser();
  const userRole = getUserRole();
  const hospitalId = getHospitalId();

  // Get the correct entity ID based on role
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
      hospitalId,
    },
    {
      skip: userRole !== "hospital", // Only fetch for hospital admin
      refetchOnMountOrArgChange: true,
    }
  );

  // Role-based notifications - for doctors AND staff
  const roleQuery = useGetNotificationsByRoleQuery(
    {
      role: userRole,
      id: entityId,
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

  const [markAllAsReadHospital] = useMarkAllNotificationsAsReadByHospitalMutation();
  const [markAllAsReadRole] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  // Check if notification is unread based on role
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

  const unreadNotifications = notifications.filter(notification => 
    isNotificationUnread(notification)
  );

  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount !== localUnreadCount) {
      setLocalUnreadCount(unreadCount);
      socket.emit("unread_count_updated", {
        count: unreadCount,
        userRole: userRole,
        hospitalId: hospitalId,
        entityId: entityId
      });
    }
  }, [unreadCount, localUnreadCount, userRole, hospitalId, entityId]);

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Register socket event listeners
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

    socket.on("notifications_read_all", handleNotificationRead);
    socket.on("notification_deleted", handleNotificationRead);

    setEventsRegistered(true);

    return () => {
      unregisterNotificationEvents();
      socket.off("notifications_read_all", handleNotificationRead);
      socket.off("notification_deleted", handleNotificationRead);
      setEventsRegistered(false);
    };
  }, [refetch]);

  // Listen for socket connection/disconnection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerNotificationEvents({
          onNotificationCreated: () => {
            refetch();
            showSuccessToast("New notification received!", 2000);
          },
          onNotificationRead: () => {
            refetch();
          }
        });
        setEventsRegistered(true);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [refetch, eventsRegistered]);

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
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
      showSuccessToast("Notification marked as read", 2000);
    } catch (error) {
      console.error("Mark as read error:", error);
      showErrorToast("Failed to mark as read", 2000);
    }
  };

  const handleNotificationClick = (notification) => {
    const isUnread = isNotificationUnread(notification);
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!unreadNotifications.length) {
        showSuccessToast("No unread notifications", 2000);
        return;
      }

      const notificationIds = unreadNotifications.map(notification => notification.id);

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
      setLocalUnreadCount(0);
      showSuccessToast("All notifications marked as read", 2000);
    } catch (error) {
      console.error("Mark all as read error:", error);
      showErrorToast("Failed to mark all as read", 2000);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setSelectedNotificationId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteNotification(selectedNotificationId).unwrap();
      
      socket.emit("notification_deleted", {
        notificationId: selectedNotificationId,
        hospitalId: hospitalId,
        userId: entityId,
        userRole: userRole
      });
      
      await refetch();
      
      const deletedNotif = notifications.find(n => n.id === selectedNotificationId);
      if (deletedNotif && isNotificationUnread(deletedNotif)) {
        setLocalUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      showSuccessToast('Notification deleted successfully', 2000);
      setShowDeleteConfirm(false);
      setSelectedNotificationId(null);
    } catch (error) {
      console.error("Delete error:", error);
      showErrorToast('Failed to delete notification', 2000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getNotificationType = (type) => {
    switch (type) {
      case 'success':
        return { label: 'Success', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
      case 'warning':
        return { label: 'Warning', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' };
      case 'error':
        return { label: 'Error', className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
      default:
        return { label: 'Info', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' };
    }
  };

  const currentError = error();
  
  if (!isOpen) return null;

  return (
    <>
      <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>
              )}
              <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {isLoading() ? (
            <div className="px-5 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : currentError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-red-500 dark:text-red-400">Error loading notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentError?.data?.message || currentError?.message || 'Please try again'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Role: {userRole} | ID: {entityId || 'Not found'}
              </p>
              <button 
                onClick={() => refetch && refetch()}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const typeInfo = getNotificationType(notif.type);
              const isUnread = isNotificationUnread(notif);
              
              return (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer ${
                    isUnread ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTime(notif.createdAt)}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.className}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDeleteClick(notif.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={handleViewAll}
            className="w-full text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={14} />
            View All Notifications
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-96 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Deletion</h3>
              <button 
                onClick={cancelDelete}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this notification?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
      )}
    </>
  );
};

export default NotificationPanel;