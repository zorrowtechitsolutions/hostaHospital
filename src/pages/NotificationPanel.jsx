// src/components/layout/NotificationPanel.jsx
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

  // ✅ For STAFF: use role-based query with "staff" role
  // ✅ For HOSPITAL: use hospital-based query
  // ✅ For DOCTOR: use role-based query with "doctor" role
  
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

  // ✅ Hospital-based query (for hospital and staff only)
  const hospitalQuery = useGetNotificationsByHospitalQuery(
    {
      hospitalId,
    },
    {
      skip: !hospitalId || (userRole !== "hospital" && userRole !== "staff"),
      refetchOnMountOrArgChange: true,
    }
  );

  // ✅ Role-based query (for doctor and staff only)
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

  // ✅ Notification selection logic based on role
  const staffNotifications = roleQuery.data?.data || [];
  const hospitalNotifications = hospitalQuery.data?.data || [];

  let notifications = [];

  if (userRole === "hospital") {
    notifications = hospitalNotifications;
  } else if (userRole === "doctor") {
    notifications = roleQuery.data?.data || [];
  } else if (userRole === "staff") {
    notifications = [
      ...staffNotifications,
      ...hospitalNotifications,
    ].filter(
      (n, index, self) =>
        index === self.findIndex(item => item.id === n.id)
    );
  }

  // ✅ Update loading based on role
  const isLoading = () => {
    if (userRole === "hospital") {
      return hospitalQuery.isLoading;
    } else if (userRole === "doctor") {
      return roleQuery.isLoading;
    } else if (userRole === "staff") {
      return hospitalQuery.isLoading || roleQuery.isLoading;
    }
    return false;
  };

  // ✅ Update error based on role
  const error = () => {
    if (userRole === "hospital") {
      return hospitalQuery.error;
    } else if (userRole === "doctor") {
      return roleQuery.error;
    } else if (userRole === "staff") {
      return hospitalQuery.error || roleQuery.error;
    }
    return null;
  };

  // ✅ Update refetch based on role
  const refetch = () => {
    if (userRole === "hospital") {
      hospitalQuery.refetch();
    } else if (userRole === "doctor") {
      roleQuery.refetch();
    } else if (userRole === "staff") {
      hospitalQuery.refetch();
      roleQuery.refetch();
    }
  };

  // Mutations
  const [markAllAsReadHospital] = useMarkAllNotificationsAsReadByHospitalMutation();
  const [markAllAsReadRole] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  // ✅ Filter unread based on user role
  const unreadNotifications = notifications.filter(notification => {
    if (userRole === "hospital") {
      // Hospital uses hospitalReadStatus
      return !notification.hospitalReadStatus?.[hospitalId];
    } else if (userRole === "doctor") {
      // Doctor uses doctorReadStatus
      return !notification.doctorReadStatus?.[entityId];
    } else if (userRole === "staff") {
      // Staff uses staffReadStatus
      return !notification.staffReadStatus?.[entityId];
    }
    return false;
  });

  const unreadCount = unreadNotifications.length;

  // ✅ Update local unread count and emit event for badge update
  useEffect(() => {
    if (unreadCount !== localUnreadCount) {
      setLocalUnreadCount(unreadCount);
      // Emit event for badge to update
      socket.emit("unread_count_updated", {
        count: unreadCount,
        userRole: userRole,
        hospitalId: hospitalId,
        entityId: entityId
      });
    }
  }, [unreadCount, localUnreadCount, userRole, hospitalId, entityId]);

  // ✅ Notify parent component of unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Register socket event listeners
  useEffect(() => {
    const handleNotificationCreated = () => {
      if (refetch) refetch();
      showSuccessToast("New notification received!", 2000);
    };

    const handleNotificationRead = () => {
      if (refetch) refetch();
    };

    registerNotificationEvents({
      onNotificationCreated: handleNotificationCreated,
      onNotificationRead: handleNotificationRead,
    });

    // Additional socket listeners
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
            if (refetch) refetch();
            showSuccessToast("New notification received!", 2000);
          },
          onNotificationRead: () => {
            if (refetch) refetch();
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

  // ✅ Check if notification is unread based on role
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

  // ✅ Mark a single notification as read
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
      
      // Emit socket event for real-time updates
      socket.emit("notification_read", {
        notificationId: notificationId,
        hospitalId: hospitalId,
        userId: entityId,
        userRole: userRole
      });
      
      await refetch();
      
      // Update local count immediately for better UX
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
      
      showSuccessToast("Notification marked as read", 2000);
    } catch (error) {
      console.error("Mark as read error:", error);
      showErrorToast("Failed to mark as read", 2000);
    }
  };

  // Handle notification click - marks as read if unread
  const handleNotificationClick = (notification) => {
    const isUnread = isNotificationUnread(notification);
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }
  };

  // ✅ Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      if (!unreadNotifications.length) {
        showSuccessToast("No unread notifications", 2000);
        return;
      }

      const notificationIds = unreadNotifications.map(notification => notification.id);

      if (userRole === "hospital") {
        // Hospital uses hospital-based mark all
        await markAllAsReadHospital({
          hospitalId: Number(hospitalId),
          notificationIds,
        }).unwrap();
      } else if (userRole === "doctor" || userRole === "staff") {
        // Doctor and staff use role-based mark all
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
      
      // Update local count immediately
      setLocalUnreadCount(0);
      
      showSuccessToast("All notifications marked as read", 2000);
    } catch (error) {
      console.error("Mark all as read error:", error);
      showErrorToast("Failed to mark all as read", 2000);
    }
  };

  // Delete notification
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
      
      // Update local count
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

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Get notification type color/label
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

  // Log for debugging
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
          ) : unreadNotifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No unread notifications</p>
            </div>
          ) : (
            unreadNotifications.map((notif) => {
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

        {/* Footer - ALWAYS SHOW VIEW ALL BUTTON */}
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