import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetNotificationsByHospitalQuery,
  useMarkAllNotificationsAsReadByHospitalMutation,
  useDeleteNotificationMutation,
  useUpdateNotificationMutation,
} from '../../app/service/notification';
import { getHospitalId, getUserRole } from '../utils/auth';
import { showSuccessToast, showErrorToast } from '../components/ui/Toast';
import { socket } from '../socket/socket';
import { registerNotificationEvents, unregisterNotificationEvents } from '../socket/notificationEvents';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [eventsRegistered, setEventsRegistered] = useState(false);
  
  const hospitalId = getHospitalId();
  const userRole = getUserRole();

  const { 
    data: notificationsData, 
    isLoading, 
    error,
    refetch 
  } = useGetNotificationsByHospitalQuery({
    hospitalId: hospitalId,
  }, {
    skip: !hospitalId,
    pollingInterval: isOpen ? 30000 : 0,
  });

  const [markAllAsRead] = useMarkAllNotificationsAsReadByHospitalMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();

  const notifications = notificationsData?.data || [];
  
  const unreadNotifications = notifications.filter(
    n => !n.hospitalReadStatus?.[hospitalId]
  );
  
  const unreadCount = unreadNotifications.length;

  // Register socket event listeners
  useEffect(() => {
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

    return () => {
      unregisterNotificationEvents();
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

  // Mark a single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateNotification({
        id: notificationId,
        body: {
          hospitalReadStatus: {
            [hospitalId]: true
          }
        }
      }).unwrap();
      
      socket.emit("notification_read", {
        notificationId: notificationId,
        hospitalId: hospitalId,
        userId: userRole
      });
      
      if (refetch) await refetch();
      showSuccessToast("Notification marked as read", 2000);
    } catch (error) {
      showErrorToast("Failed to mark as read", 2000);
    }
  };

  // Handle notification click - marks as read if unread
  const handleNotificationClick = (notification) => {
    const isUnread = !notification.hospitalReadStatus?.[hospitalId];
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      if (!hospitalId) return;

      const notificationIds = unreadNotifications.map(
        notification => notification.id
      );

      if (!notificationIds.length) return;

      await markAllAsRead({
        hospitalId: Number(hospitalId),
        notificationIds,
      }).unwrap();

      socket.emit("notifications_read_all", {
        hospitalId: hospitalId,
        userId: userRole,
        count: notificationIds.length
      });

      if (refetch) await refetch();
      showSuccessToast("All notifications marked as read");
    } catch (error) {
      showErrorToast("Failed to mark all as read");
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
        hospitalId: hospitalId
      });
      
      if (refetch) await refetch();
      showSuccessToast('Notification deleted successfully');
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
          {isLoading ? (
            <div className="px-5 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-center">
              <p className="text-red-500 dark:text-red-400">Error loading notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {error?.data?.message || error?.message || 'Please try again'}
              </p>
              <button 
                onClick={() => refetch && refetch()}
                className="mt-2 text-sm text-purple-600 hover:text-purple-700"
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
              
              return (
                <div 
                  key={notif.id} 
                  onClick={() => handleNotificationClick(notif)}
                  className="group relative px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 bg-purple-50 dark:bg-purple-900/20 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
        {unreadNotifications.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button 
              onClick={handleViewAll}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye size={14} />
              View All Notifications
            </button>
          </div>
        )}
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