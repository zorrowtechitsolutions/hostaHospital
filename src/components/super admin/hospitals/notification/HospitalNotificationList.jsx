// src/components/super-admin/hospital/HospitalNotificationList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Calendar, UserPlus, XCircle, RefreshCcw, Eye, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetUnreadNotificationsQuery,
  useGetReadNotificationsQuery,
} from '../../../../../app/service/notification';
import { showSuccessToast } from '../../../ui/Toast';
import { Pagination } from '../../../ui/Pagination';
import { Button, Card, Badge } from '../../../ui';

// Import socket
import { socket } from '../../../../socket/socket';
import { registerNotificationEvents, unregisterNotificationEvents } from '../../../../socket/notificationEvents';

const HospitalNotificationList = () => {
  const { id: hospitalId } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [eventsRegistered, setEventsRegistered] = useState(false);

  // Get unread notifications: /notification/unread/hospital/1
  const { 
    data: unreadData, 
    isLoading: unreadLoading,
    refetch: refetchUnread,
    isFetching: isFetchingUnread
  } = useGetUnreadNotificationsQuery({
    role: 'hospital',
    id: Number(hospitalId),
  }, {
    skip: !hospitalId,
  });

  // Get read notifications: /notification/read/hospital/1
  const { 
    data: readData, 
    isLoading: readLoading,
    refetch: refetchRead,
    isFetching: isFetchingRead
  } = useGetReadNotificationsQuery({
    role: 'hospital',
    id: Number(hospitalId),
  }, {
    skip: !hospitalId,
  });

  // Get notifications from responses
  const unreadNotifications = unreadData?.data || [];
  const readNotifications = readData?.data || [];
  const allNotifications = [...unreadNotifications, ...readNotifications];
  
  const unreadCount = unreadNotifications.length;
  const totalNotifications = allNotifications.length;

  // Combined refetch function
  const refetchAll = () => {
    refetchUnread();
    refetchRead();
  };

  // Register socket event listeners
  useEffect(() => {
    registerNotificationEvents({
      onNotificationCreated: () => {
        refetchAll();
        showSuccessToast("New notification received!", 2000);
      },
      onNotificationRead: () => {
        refetchAll();
      }
    });

    setEventsRegistered(true);

    return () => {
      unregisterNotificationEvents();
      setEventsRegistered(false);
    };
  }, [refetchAll]);

  // Listen for socket connection
  useEffect(() => {
    const handleConnect = () => {
      if (!eventsRegistered) {
        registerNotificationEvents({
          onNotificationCreated: () => {
            refetchAll();
            showSuccessToast("New notification received!", 2000);
          },
          onNotificationRead: () => {
            refetchAll();
          }
        });
        setEventsRegistered(true);
      }
    };

    const handleDisconnect = () => {
      setEventsRegistered(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [refetchAll, eventsRegistered]);

  const handleRefresh = () => {
    refetchAll();
    showSuccessToast('Notifications refreshed', 2000);
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

  // Combined loading state
  const isLoading = unreadLoading || readLoading;

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
            <span className="text-gray-700">Hospital</span>
            <span className="mx-1 text-gray-400">»</span>
            <span>Notifications</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hospital Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">Hospital ID: {hospitalId}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          {/* Empty div for spacing */}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={handleRefresh} title="Refresh" disabled={isFetchingUnread || isFetchingRead}>
            <RefreshCcw size={16} className={(isFetchingUnread || isFetchingRead) ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {allNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-500">All caught up!</p>
        </div>
      ) : (
        <Card className="flex flex-col bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              All Notifications
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">{totalNotifications}</span>
            </h2>
          </div>
          
          <div className="flex flex-col min-h-[420px]">
            <div className="divide-y divide-gray-100">
              {allNotifications.map((notif) => {
                const typeInfo = getTypeInfo(notif.type);
                const isUnread = !notif.hospitalReadStatus?.[hospitalId] && !notif.isRead;
                
                return (
                  <div
                    key={notif.id}
                    className={`p-6 hover:bg-gray-50 transition-all duration-200 ${
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
                                {notif.title || notif.message?.substring(0, 50) || 'Notification'}
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
                totalPages={Math.ceil(totalNotifications / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={totalNotifications}
                itemsPerPage={itemsPerPage}
                itemLabel="notifications"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HospitalNotificationList;