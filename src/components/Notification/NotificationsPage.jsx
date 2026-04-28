import React, { useState } from 'react';
import { Bell, Trash2, CheckCheck, ArrowLeft, Calendar, UserPlus, XCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: 'John Doe added new patient appointment booking', 
      description: 'John Doe has scheduled a new appointment for patient consultation.',
      time: '4 min ago', 
      read: false,
      type: 'booking'
    },
    { 
      id: 2, 
      title: 'Thomas William booked a new appointment.', 
      description: 'Thomas William booked an appointment for regular checkup.',
      time: '15 min ago', 
      read: false,
      type: 'booking'
    },
    { 
      id: 3, 
      title: 'Sarah Anderson has been successfully booked for April 5 at 10:00 AM.', 
      description: 'Appointment confirmed with Dr. Smith for follow-up consultation.',
      time: '45 Min Ago', 
      read: true,
      type: 'booking'
    },
    { 
      id: 4, 
      title: 'Ann McClure cancelled her appointment scheduled for February 5, 2024.', 
      description: 'Appointment cancellation reason: Personal reasons.',
      time: '58 Min Ago', 
      read: true,
      type: 'cancellation'
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteAll = () => {
    setShowDeleteConfirm(true);
    setSelectedNotificationId('all');
  };

  const handleDeleteClick = (id) => {
    setSelectedNotificationId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedNotificationId === 'all') {
      setNotifications([]);
    } else {
      setNotifications(prev => prev.filter(notif => notif.id !== selectedNotificationId));
    }
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedNotificationId(null);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'booking':
        return <UserPlus size={18} className="text-green-500" />;
      case 'cancellation':
        return <XCircle size={18} className="text-red-500" />;
      default:
        return <Calendar size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="text-sm text-gray-500">
              <span className="text-gray-600">Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">All Notifications</h2>
          <div className="flex gap-3">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
            <button
              onClick={deleteAll}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete All
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group p-6 hover:bg-gray-50 transition-all duration-200 ${
                    !notif.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        !notif.read ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-base ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          {notif.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {notif.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">{notif.time}</span>
                            {notif.type === 'cancellation' && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                Cancelled
                              </span>
                            )}
                            {!notif.read && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-200 transition-all"
                        >
                          <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                  ? 'Are you sure you want to delete all notifications?'
                  : 'Are you sure you want to delete this notification?'
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