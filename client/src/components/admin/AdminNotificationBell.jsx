import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import notificationService from '../../services/notificationService.js';

export default function AdminNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (user?.role !== 'admin') return;
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
      console.warn('Failed to fetch admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and real-time socket listeners
  useEffect(() => {
    if (user?.role !== 'admin') return;

    fetchNotifications();

    let socket = null;
    let isMounted = true;

    // Gracefully connect with socket.io-client if available
    import('socket.io-client')
      .then(({ io }) => {
        if (!isMounted || !io) return;
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        socket = io(socketUrl, { withCredentials: true, autoConnect: true });

        socket.emit('join_admin_room', user);

        // Listen for new organizer privilege requests
        socket.on('new_organizer_request', (data) => {
          if (!isMounted) return;
          const newNotif = data?.notification || {
            _id: `temp_${Date.now()}`,
            id: `temp_${Date.now()}`,
            type: 'new_organizer_request',
            title: 'New Organizer Request',
            message: `${data?.applicant?.name || 'A student'} applied for Organizer privileges for ${
              data?.applicant?.clubAffiliation || 'Club'
            }.`,
            createdAt: new Date().toISOString(),
            isRead: false,
            senderId: data?.applicant?.id,
          };

          const newId = newNotif._id || newNotif.id;
          setNotifications((prev) => {
            if (prev.some((n) => (n._id || n.id) === newId)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, { body: newNotif.message });
          }
        });

        // Listen for new event creation approval requests
        socket.on('new_event_request', (data) => {
          if (!isMounted) return;
          const newNotif = data?.notification || {
            _id: `temp_${Date.now()}`,
            id: `temp_${Date.now()}`,
            type: 'event_pending_approval',
            title: 'New Event Approval Request',
            message: `Organizer submitted "${data?.event?.title || 'an event'}" for ${
              data?.event?.club || 'Club'
            } scheduled on ${data?.event?.date || 'TBA'}.`,
            data: {
              eventId: data?.event?.id,
              title: data?.event?.title,
              club: data?.event?.club,
              date: data?.event?.date,
              venue: data?.event?.venue,
            },
            createdAt: new Date().toISOString(),
            isRead: false,
          };

          const newId = newNotif._id || newNotif.id;
          setNotifications((prev) => {
            if (prev.some((n) => (n._id || n.id) === newId)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, { body: newNotif.message });
          }
        });

        // Listen when an organizer request is processed (approved / rejected) anywhere
        socket.on('organizer_request_processed', (data) => {
          if (!isMounted) return;
          const targetUserId = data?.userId;
          if (targetUserId) {
            setNotifications((prev) =>
              prev.map((n) => {
                const isMatch =
                  n.type === 'new_organizer_request' &&
                  (n.senderId === targetUserId ||
                    n.data?.userId === targetUserId ||
                    n.data?.applicantId === targetUserId);
                return isMatch ? { ...n, isRead: true } : n;
              })
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          fetchNotifications();
        });

        // Listen when an event approval request is processed (approved / declined)
        socket.on('event_request_processed', (data) => {
          if (!isMounted) return;
          const targetEventId = data?.eventId;
          if (targetEventId) {
            setNotifications((prev) =>
              prev.map((n) => {
                const isMatch =
                  n.type === 'event_pending_approval' &&
                  (n.data?.eventId === targetEventId || n.eventId === targetEventId);
                return isMatch ? { ...n, isRead: true } : n;
              })
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          fetchNotifications();
        });
      })
      .catch(() => {
        // socket.io-client not loaded; notifications function via REST polling
      });

    // Regular background polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [user, fetchNotifications]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;

    // Immediately update UI state
    setNotifications((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Persist to backend if valid ID
    if (!id.startsWith('temp_')) {
      try {
        await notificationService.markAsRead(id);
      } catch (err) {
        console.warn('[AdminNotificationBell] markAsRead error:', err);
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    // Immediately update UI state
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('[AdminNotificationBell] markAllAsRead error:', err);
    } finally {
      fetchNotifications();
    }
  };

  // Review a specific request and navigate
  const handleReviewRequest = async (notif) => {
    setIsOpen(false);
    const notifId = notif._id || notif.id;

    // Immediately mark as read in local state
    if (notifId) {
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === notifId ? { ...n, isRead: true } : n))
      );
      if (!notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (!notifId.startsWith('temp_')) {
        notificationService.markAsRead(notifId).catch((err) => {
          console.warn('[AdminNotificationBell] markAsRead on review error:', err);
        });
      }
    }

    if (notif.type === 'event_pending_approval') {
      navigate('/dashboard?tab=review-queue');
    } else {
      navigate('/users?tab=requests');
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#14213D] hover:bg-[#E5E5E5]/60 transition focus:outline-none"
        aria-label="Admin Notifications"
        title="Admin Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-[#14213D] bg-[#FCA311] rounded-full shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
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
                className="text-xs font-semibold text-[#FCA311] hover:text-white transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E5E5E5]">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => {
                const notifId = notif._id || notif.id;
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notifId}
                    onClick={() => handleReviewRequest(notif)}
                    className={`p-3.5 hover:bg-[#F5F5F5] transition cursor-pointer flex items-start gap-3 ${
                      isUnread ? 'bg-[#FCA311]/5' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 font-bold shadow-xs ${
                        notif.type === 'event_pending_approval'
                          ? 'bg-[#FCA311]/20 text-[#14213D]'
                          : 'bg-[#14213D] text-[#FCA311]'
                      }`}
                    >
                      {notif.type === 'event_pending_approval' ? '📅' : '🏛️'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {notif.title || 'New Request'}
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
                            ? new Date(notif.createdAt).toLocaleTimeString([], {
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
                              className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 hover:text-[#14213D] hover:bg-[#E5E5E5] transition border border-[#E5E5E5]"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          )}
                          <span className="text-[#14213D] font-bold hover:text-[#FCA311] flex items-center gap-0.5">
                            <span>Review</span>
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
                navigate('/users?tab=requests');
              }}
              className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] transition"
            >
              Go to Organizer Requests Table &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
