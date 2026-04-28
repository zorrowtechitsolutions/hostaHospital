import React, { useState } from 'react';
import { Bell, Trash2, CheckCheck, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: 'John Doe added new patient appointment booking', 
      time: '4 min ago', 
      read: false,
      type: 'booking'
    },
    { 
      id: 2, 
      title: 'Thomas William booked a new appointment.', 
      time: '15 min ago', 
      read: false,
      type: 'booking'
    },
    { 
      id: 3, 
      title: 'Sarah Anderson has been successfully booked for April 5 at 10:00 AM.', 
      time: '45 Min Ago', 
      read: true,
      type: 'booking'
    },
    { 
      id: 4, 
      title: 'Ann McClure cancelled her appointment scheduled for February 5, 2024', 
      time: '58 Min Ago', 
      read: true,
      type: 'cancellation'
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleDeleteClick = (id) => {
    setSelectedNotificationId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setNotifications(prev => prev.filter(notif => notif.id !== selectedNotificationId));
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay updated with latest activities</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={markAllAsRead}
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
              <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {notifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`group relative px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                  !notif.read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => markAsRead(notif.id)}>
                  {/* Unread indicator */}
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 mt-2 flex-shrink-0"></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{notif.time}</span>
                      {notif.type === 'cancellation' && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Delete button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
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