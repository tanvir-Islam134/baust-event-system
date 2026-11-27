import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import notificationService from '../../services/notificationService.js';

function getNotifIcon(type) {
  switch (type) {
    case 'registration_approved':
    case 'event_approved':
    case 'organizer_request_approved':
      return { icon: '✅', bg: 'bg-emerald-100 text-emerald-700' };
    case 'registration_rejected':
    case 'event_declined':
    case 'event_rejected':
    case 'organizer_request_rejected':
      return { icon: '⚠️', bg: 'bg-rose-100 text-rose-700' };
    case 'registration_submitted':
      return { icon: '🎫', bg: 'bg-[#FCA311]/20 text-[#14213D]' };
    case 'new_event_published':
    case 'event_updated':
    case 'event_pending_approval':
      return { icon: '📅', bg: 'bg-[#FCA311]/20 text-[#14213D]' };
    default:
      return { icon: '🏛️', bg: 'bg-[#14213D] text-[#FCA311]' };
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const userId = user?.uid || user?.id;
  const role = user?.role;

  const fetchNotifications = useCallback(async () => {
    if (!userId && !role) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      const list = Array.isArray(res?.data) ? res.data : [];
      setNotifications(list);
      setUnreadCount(
        typeof res?.unreadCount === 'number'
          ? res.unreadCount
          : list.filter((n) => !n.isRead).length
      );
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    let socket = null;
    let isMounted = true;

    const shouldConnectSocket =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('localhost') || Boolean(import.meta.env.VITE_SERVER_URL));

    if (shouldConnectSocket) {
      import('socket.io-client')
        .then(({ io }) => {
          if (!isMounted || !io) return;
          const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
          socket = io(socketUrl, { withCredentials: true, autoConnect: true });

          if (role === 'admin') {
            socket.emit('join_admin_room', user);
          }
          socket.emit('join_user_room', user);

          const refreshEvents = [
            'new_organizer_request',
            'new_event_request',
            'organizer_request_processed',
            'event_request_processed',
            'event_status_updated',
            'organizer_status_updated',
            'notification_created',
          ];

          refreshEvents.forEach((evtName) => {
            socket.on(evtName, () => {
              if (isMounted) fetchNotifications();
            });
          });
        })
        .catch(() => {});
    }

    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [user, role, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;

    setNotifications((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (!id.startsWith('temp_')) {
      try {
        await notificationService.markAsRead(id);
      } catch (err) {
        console.warn('[NotificationBell] markAsRead error:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('[NotificationBell] markAllAsRead error:', err);
    } finally {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    const notifId = notif._id || notif.id;

    if (notifId && !notif.isRead) {
      handleMarkAsRead(notifId);
    }

    // Role & notification-type smart navigation
    if (role === 'admin') {
      if (notif.type === 'event_pending_approval') {
        navigate('/dashboard?tab=review-queue');
      } else {
        const applicantId = notif.senderId || notif.data?.applicantId || notif.data?.userId;
        navigate(applicantId ? `/users?tab=requests&userId=${applicantId}` : '/users?tab=requests');
      }
      return;
    }

    if (role === 'organizer') {
      if (notif.type === 'registration_submitted') {
        navigate('/dashboard?tab=pending-registrations');
      } else {
        navigate('/dashboard?tab=manage-events');
      }
      return;
    }

    // Participant / Student
    if (notif.data?.eventId && (notif.type === 'new_event_published' || notif.type === 'event_updated')) {
      navigate(`/events/${notif.data.eventId}`);
    } else if (notif.type === 'registration_approved' || notif.type === 'registration_rejected') {
      navigate('/my-events');
    } else {
      navigate('/dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#14213D] hover:bg-[#E5E5E5]/60 transition focus:outline-none cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-[#14213D] bg-[#FCA311] rounded-full shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-[#1e2f52] flex items-center justify-between bg-[#14213D] text-white">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FCA311] text-[#14213D]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-[#FCA311] hover:text-white transition cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E5E5E5]">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => {
                const notifId = notif._id || notif.id;
                const isUnread = !notif.isRead;
                const { icon, bg } = getNotifIcon(notif.type);

                return (
                  <div
                    key={notifId}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-[#F5F5F5] transition cursor-pointer flex items-start gap-3 ${
                      isUnread ? 'bg-[#FCA311]/5' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 font-bold shadow-xs ${bg}`}
                    >
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {notif.title || 'Notification'}
                        </span>
                        {isUnread ? (
                          <span
                            className="w-2 h-2 rounded-full bg-[#FCA311] flex-shrink-0"
                            title="Unread notification"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Read</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400 font-medium">
                        <span>
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notifId, e)}
                              className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 hover:text-[#14213D] hover:bg-[#E5E5E5] transition border border-[#E5E5E5] cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                          <span className="text-[#14213D] font-bold hover:text-[#FCA311] flex items-center gap-0.5">
                            <span>Open</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-[#E5E5E5] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (role === 'admin') navigate('/users?tab=requests');
                else if (role === 'organizer') navigate('/dashboard?tab=pending-registrations');
                else navigate('/my-events');
              }}
              className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] transition cursor-pointer"
            >
              {role === 'admin'
                ? 'Go to Organizer Requests Table →'
                : role === 'organizer'
                ? 'Go to Registration Queue →'
                : 'View My Events & Passes →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
