import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import registrationService from '../services/registrationService.js';
import adminService from '../services/adminService.js';
import eventService from '../services/eventService.js';
import userService from '../services/userService.js';
import ClubOrganizersDirectory from '../components/ClubOrganizersDirectory.jsx';
import OrganizerCreateEvent from '../components/organizer/OrganizerCreateEvent.jsx';
import OrganizerManageEvents from '../components/organizer/OrganizerManageEvents.jsx';
import StudentEventFeed from '../components/events/StudentEventFeed.jsx';
import AdminEventReviewQueue from '../components/admin/AdminEventReviewQueue.jsx';
import DigitalTicketModal from '../components/events/DigitalTicketModal.jsx';
import campusBanner from '../assets/baust-campus.jpg';

export default function DashboardPage({ defaultTab = null }) {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';
  const canManageEvents = isOrganizer || isAdmin;

  // Active view tab: 'overview' (default) | 'create-event' | 'manage-events' | 'review-queue' | 'pending-registrations'
  const tabFromUrl = searchParams.get('tab');
  const activeTab = defaultTab || tabFromUrl || 'overview';
  const organizerTab = activeTab;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin: Organizers Directory count state & Pending requests count
  const [organizersCount, setOrganizersCount] = useState(0);
  const [adminRequestsCount, setAdminRequestsCount] = useState(0);

  // Organizer: My Published Events state
  const [myEvents, setMyEvents] = useState([]);
  const [loadingMyEvents, setLoadingMyEvents] = useState(false);

  // Organizer: Pending Event Registrations state
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [processingRegId, setProcessingRegId] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Student: Registered Events & Passes state
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loadingMyRegistrations, setLoadingMyRegistrations] = useState(false);
  const [activeTicketData, setActiveTicketData] = useState(null);
  const [loadingTicketPassId, setLoadingTicketPassId] = useState(null);

  // Rejection modal state for participant registrations
  const [rejectingReg, setRejectingReg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Student: Rejected organizer request acknowledgment state
  const [rejectionDismissed, setRejectionDismissed] = useState(() => {
    if (typeof window === 'undefined' || !user) return false;
    return localStorage.getItem(`baust_rejection_ack_${user.uid || user.id}`) === 'true';
  });

  useEffect(() => {
    if (user?.uid || user?.id) {
      setRejectionDismissed(
        localStorage.getItem(`baust_rejection_ack_${user.uid || user.id}`) === 'true'
      );
    }
  }, [user?.uid, user?.id]);

  const handleDismissRejection = async () => {
    setRejectionDismissed(true);
    if (user?.uid || user?.id) {
      localStorage.setItem(`baust_rejection_ack_${user.uid || user.id}`, 'true');
    }
    try {
      await userService.dismissRejectionNotice();
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.warn('Failed to dismiss rejection:', err);
    }
  };

  const fetchMyEvents = useCallback(async () => {
    if (!isOrganizer && !isAdmin) return;
    try {
      setLoadingMyEvents(true);
      const data = await eventService.getMyEvents();
      setMyEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load organizer events:', err);
    } finally {
      setLoadingMyEvents(false);
    }
  }, [isOrganizer, isAdmin]);

  const fetchPendingRegistrations = useCallback(async () => {
    if (!isOrganizer) return;
    try {
      setLoadingRegistrations(true);
      const data = await registrationService.getOrganizerPendingRegistrations();
      setPendingRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load organizer pending registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  }, [isOrganizer]);

  const fetchAdminOrganizersCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await adminService.getApprovedOrganizers();
      setOrganizersCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.warn('Failed to load admin organizers count:', err);
    }
  }, [isAdmin]);

  const fetchAdminPendingRequests = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const requests = await userService.getOrganizerRequests();
      setAdminRequestsCount(Array.isArray(requests) ? requests.length : 0);
    } catch (err) {
      console.warn('Failed to load admin pending requests:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  useEffect(() => {
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  const fetchMyRegistrations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingMyRegistrations(true);
      const data = await registrationService.getMyRegistrations();
      setMyRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch user registrations:', err);
    } finally {
      setLoadingMyRegistrations(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  const handleViewTicketPass = async (reg) => {
    try {
      setLoadingTicketPassId(reg.id);
      const fullTicket = await registrationService.getTicket(reg.id);
      setActiveTicketData(fullTicket);
    } catch {
      setActiveTicketData({
        registration: reg,
        event: {
          title: reg.eventTitle || 'Campus Event',
          date: reg.eventDate,
          time: reg.eventTime,
          venue: reg.eventVenue,
          category: reg.eventCategory,
          clubName: reg.clubName,
        },
        attendee: {
          name: user?.name || 'Attendee',
          email: user?.email || '',
          studentId: user?.studentId || null,
          department: user?.department || null,
          batch: user?.batch || reg.batch || null,
          section: user?.section || reg.section || null,
        },
      });
    } finally {
      setLoadingTicketPassId(null);
    }
  };

  const formatPassDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    try {
      let clean = String(dateStr).trim();
      if (clean.startsWith('26444-')) clean = clean.replace('26444-', '2026-');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return clean;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isEventPast = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      let clean = String(dateStr).trim();
      if (clean.startsWith('26444-')) clean = clean.replace('26444-', '2026-');
      const eventDateObj = new Date(`${clean}T23:59:59`);
      if (!isNaN(eventDateObj.getTime())) {
        return eventDateObj < new Date();
      }
      const fallback = new Date(clean);
      return !isNaN(fallback.getTime()) && fallback < new Date();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchAdminOrganizersCount();
    fetchAdminPendingRequests();
  }, [fetchAdminOrganizersCount, fetchAdminPendingRequests]);

  // Real-time Socket.io listener for event approval status changes (reflects immediately on Organizer view)
  useEffect(() => {
    if (!user) return;

    let socket = null;
    let isMounted = true;

    import('socket.io-client')
      .then(({ io }) => {
        if (!isMounted || !io) return;
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        socket = io(socketUrl, { withCredentials: true, autoConnect: true });

        socket.emit('join_user_room', user);

        socket.on('event_status_updated', (data) => {
          if (!isMounted) return;
          const isApproved = data?.status === 'approved';
          showToast(
            `Event "${data?.title || 'Your event'}" was ${isApproved ? 'Approved & Published! 🎉' : 'Declined ⚠️'}${
              data?.reason ? ` (Reason: ${data.reason})` : ''
            }`,
            isApproved ? 'success' : 'error'
          );
          fetchMyEvents();
        });

        socket.on('organizer_status_updated', async (data) => {
          if (!isMounted) return;
          if (data?.status === 'rejected') {
            setRejectionDismissed(false);
            if (user?.uid || user?.id) {
              localStorage.removeItem(`baust_rejection_ack_${user.uid || user.id}`);
            }
          }
          if (refreshUser) await refreshUser();
          showToast(
            data?.status === 'approved'
              ? 'Your organizer privileges have been approved!'
              : `Your organizer request was declined${data?.rejectionReason ? `: ${data.rejectionReason}` : '.'}`,
            data?.status === 'approved' ? 'success' : 'error'
          );
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [user, fetchMyEvents]);

  const handleEventCreated = (created) => {
    showToast('Event created successfully! It is now pending administrative approval.', 'success');
    fetchMyEvents();
    handleTabChange('manage-events');
  };

  const handleApproveRegistration = async (regId) => {
    try {
      setProcessingRegId(regId);
      await registrationService.approveRegistration(regId);
      showToast('Registration accepted successfully!');
      await fetchPendingRegistrations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to approve registration', 'error');
    } finally {
      setProcessingRegId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReg) return;
    try {
      setProcessingRegId(rejectingReg.id);
      await registrationService.rejectRegistration(rejectingReg.id, rejectReason);
      showToast('Registration rejected.');
      setRejectingReg(null);
      setRejectReason('');
      await fetchPendingRegistrations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to reject registration', 'error');
    } finally {
      setProcessingRegId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in border ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 1. DEDICATED VIEW: CREATE EVENT */}
      {canManageEvents && activeTab === 'create-event' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Breadcrumb Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="px-3.5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                <span>Back to Dashboard</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleTabChange('overview')}
                  className="hover:text-[#14213D] transition cursor-pointer"
                >
                  Dashboard
                </button>
                <span>/</span>
                <span className="text-[#14213D] font-bold">Create Campus Event</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('manage-events')}
              className="px-3.5 py-2 bg-[#E5E5E5]/60 hover:bg-[#E5E5E5] text-[#14213D] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📋</span>
              <span>Manage Events ({myEvents.length})</span>
            </button>
          </div>

          {/* Organizer Create Event Form */}
          <OrganizerCreateEvent
            onEventCreated={handleEventCreated}
            onCancel={() => handleTabChange('overview')}
          />
        </div>
      )}

      {/* 2. DEDICATED VIEW: MANAGE EVENTS */}
      {canManageEvents && activeTab === 'manage-events' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Breadcrumb Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="px-3.5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                <span>Back to Dashboard</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleTabChange('overview')}
                  className="hover:text-[#14213D] transition cursor-pointer"
                >
                  Dashboard
                </button>
                <span>/</span>
                <span className="text-[#14213D] font-bold">Manage Events</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('create-event')}
              className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs font-black shadow-md shadow-[#FCA311]/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span>
              <span>Create New Event</span>
            </button>
          </div>

          <OrganizerManageEvents
            events={myEvents}
            loading={loadingMyEvents}
            onRefresh={fetchMyEvents}
            onCreateClick={() => handleTabChange('create-event')}
          />
        </div>
      )}

      {/* 3. DEDICATED VIEW: ADMIN REVIEW QUEUE */}
      {isAdmin && activeTab === 'review-queue' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="px-3.5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                <span>Back to Dashboard</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleTabChange('overview')}
                  className="hover:text-[#14213D] transition cursor-pointer"
                >
                  Dashboard
                </button>
                <span>/</span>
                <span className="text-[#14213D] font-bold">Admin Review Queue</span>
              </div>
            </div>
          </div>

          <AdminEventReviewQueue
            onEventReviewed={() => {
              fetchMyEvents();
            }}
          />
        </div>
      )}

      {/* 4. DEDICATED VIEW: PENDING REGISTRATIONS */}
      {canManageEvents && activeTab === 'pending-registrations' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="px-3.5 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                <span>Back to Dashboard</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => handleTabChange('overview')}
                  className="hover:text-[#14213D] transition cursor-pointer"
                >
                  Dashboard
                </button>
                <span>/</span>
                <span className="text-[#14213D] font-bold">Registration Queue</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('manage-events')}
              className="px-3.5 py-2 bg-[#E5E5E5]/60 hover:bg-[#E5E5E5] text-[#14213D] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📋</span>
              <span>Manage Events ({myEvents.length})</span>
            </button>
          </div>

          {/* Pending Registrations Table */}
          <div id="pending-registrations" className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-[#E5E5E5]/30">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#14213D]">Pending Event Registrations</h2>
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-[#FCA311] text-[#14213D]">
                    {pendingRegistrations.length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Review and approve participant applications for events hosted by{' '}
                  <span className="font-semibold text-[#14213D]">
                    🏛️ {user?.clubAffiliation || 'Your Assigned Club'}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={fetchPendingRegistrations}
                disabled={loadingRegistrations}
                className="px-3.5 py-1.5 border border-[#E5E5E5] bg-white hover:border-[#FCA311] rounded-xl text-xs font-bold text-[#14213D] transition flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loadingRegistrations ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh List</span>
              </button>
            </div>

            {/* Content Area */}
            {loadingRegistrations && (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-slate-500">Loading pending applications...</p>
              </div>
            )}

            {!loadingRegistrations && pendingRegistrations.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xl mb-2 font-bold">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-[#14213D]">All Caught Up!</h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                  There are currently no pending participant registrations awaiting approval for{' '}
                  {user?.clubAffiliation || 'your club'}.
                </p>
              </div>
            )}

            {!loadingRegistrations && pendingRegistrations.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E5E5E5] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Cohort Details</th>
                      <th className="py-3 px-4">Options & Payment</th>
                      <th className="py-3 px-4 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-xs text-slate-700">
                    {pendingRegistrations.map((reg) => {
                      const isProcessing = processingRegId === reg.id;

                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                          {/* Event Title & Date */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="font-bold text-[#14213D] block text-xs truncate max-w-xs">
                                {reg.eventTitle}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                📅 {reg.eventDate || 'Date TBA'} {reg.eventVenue ? `• 📍 ${reg.eventVenue}` : ''}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Fee: {reg.eventFee > 0 ? `৳${reg.eventFee}` : 'Free'}
                              </span>
                            </div>
                          </td>

                          {/* Participant Name & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#14213D] text-[#FCA311] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {reg.participantName ? reg.participantName.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-[#14213D] block truncate">
                                  {reg.participantName}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {reg.participantEmail}
                                </span>
                                {reg.participantPhone && reg.participantPhone !== 'N/A' && (
                                  <span className="text-[10px] text-slate-500 block">
                                    📞 {reg.participantPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Cohort / Department */}
                          <td className="py-3.5 px-4">
                            {reg.isGuest ? (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#E5E5E5] text-slate-700">
                                Guest Participant
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                {reg.department && (
                                  <span className="font-semibold text-[#14213D] block truncate max-w-[200px]">
                                    {reg.department}
                                  </span>
                                )}
                                <span className="text-slate-600 block">
                                  {reg.studentId ? `ID: ${reg.studentId}` : ''}
                                  {reg.batch ? ` • ${reg.batch}` : ''}
                                  {reg.section ? ` • Sec ${reg.section}` : ''}
                                </span>
                                {(reg.level || reg.term) && (
                                  <span className="text-[11px] text-slate-400 block">
                                    {reg.level ? `L-${reg.level} ` : ''}
                                    {reg.term ? `T-${reg.term}` : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Options & Payment */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {(reg.tshirtSize || reg.foodType) && (
                                <div className="flex flex-wrap gap-1">
                                  {reg.tshirtSize && (
                                    <span className="px-1.5 py-0.5 bg-[#14213D]/10 text-[#14213D] rounded text-[10px] font-bold border border-[#14213D]/20">
                                      👕 {reg.tshirtSize}
                                    </span>
                                  )}
                                  {reg.foodType && (
                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200 capitalize">
                                      🍲 {reg.foodType}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-[#E5E5E5] text-[#14213D] rounded text-[10px] font-bold uppercase">
                                  {reg.paymentMethod || 'cash'}
                                </span>
                                {reg.trxId && (
                                  <span className="text-[11px] font-mono text-[#FCA311] font-bold">
                                    Trx: {reg.trxId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApproveRegistration(reg.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? 'Saving...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  setRejectingReg(reg);
                                  setRejectReason('');
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. DEFAULT VIEW: CLEAN DASHBOARD OVERVIEW (Rendered when on /dashboard with no tab) */}
      {(!canManageEvents || activeTab === 'overview') && (
        <div className="space-y-6 animate-in fade-in">
          {/* Welcome Banner with BAUST Campus Photo */}
          <div className="rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden min-h-[220px] sm:min-h-[250px] flex items-center bg-slate-950">
            {/* Background Campus Photo with Left-to-Right Black Gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={campusBanner}
                alt="BAUST Campus"
                className="w-full h-full object-cover object-[center_right] sm:object-right filter brightness-95"
              />
              {/* Left-to-right black to transparent gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 via-50% to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
            </div>

            {/* Official BAUST Crest Emblem (glass badge on the right) */}
            <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 xl:w-28 xl:h-28 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 shadow-2xl p-2.5 pointer-events-none items-center justify-center z-10 hover:scale-105 transition">
              <img
                src="/baust-logo.png"
                alt="BAUST Emblem"
                className="w-full h-full object-contain rounded-full drop-shadow-md"
              />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-semibold text-blue-200 mb-3 border border-white/20 shadow-xs">
                <img src="/baust-logo.png" alt="BAUST" className="w-4 h-4 rounded-full object-contain" />
                <span>BAUST Event System</span>
                <span>•</span>
                <span className="capitalize">{user?.role} Portal</span>
                {user?.clubAffiliation && (
                  <>
                    <span>•</span>
                    <span>🏛️ {user.clubAffiliation}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Welcome back, {user?.name || 'Organizer'}!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl drop-shadow-sm">
                {isOrganizer
                  ? `Manage your events, publish announcements, and review participant registrations for ${user?.clubAffiliation || 'your assigned club'}.`
                  : 'Stay updated with all campus conferences, academic competitions, cultural fests, and sports tournaments.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {canManageEvents ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTabChange('create-event')}
                      className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] font-extrabold rounded-lg text-sm transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Create Event</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange('manage-events')}
                      className="px-4 py-2 bg-[#14213D]/70 hover:bg-[#14213D] backdrop-blur-md text-white border border-[#E5E5E5]/30 font-bold rounded-lg text-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>Manage Events ({myEvents.length})</span>
                    </button>
                    <Link
                      to="/events"
                      className="px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-[#FCA311] font-semibold rounded-lg text-sm transition border border-[#FCA311]/30"
                    >
                      Browse Campus Events
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/events"
                      className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] font-extrabold rounded-lg text-sm transition shadow-md"
                    >
                      Browse Events
                    </Link>
                    <Link
                      to="/profile"
                      className="px-4 py-2 bg-[#14213D]/70 hover:bg-[#14213D] backdrop-blur-md text-white font-semibold rounded-lg text-sm transition border border-[#E5E5E5]/30"
                    >
                      View Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Student Notice: Organizer Application Declined */}
          {!isAdmin && !isOrganizer && !rejectionDismissed && (user?.organizerRequestStatus === 'rejected' || user?.organizerStatus === 'rejected') && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-rose-950">
                      Organizer Application Status: Declined
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-800">
                      Review Complete
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    Your application for <span className="font-semibold">{user.clubAffiliation || 'Club Organizer'}</span> was not approved by administration.
                    {user.organizerRejectionReason && (
                      <span className="block mt-0.5 text-slate-700 font-medium">
                        Feedback: &ldquo;{user.organizerRejectionReason}&rdquo;
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  to="/profile"
                  onClick={handleDismissRejection}
                  className="px-4 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
                >
                  Review in Profile
                </Link>
                <button
                  type="button"
                  onClick={handleDismissRejection}
                  className="p-2 text-rose-500 hover:text-rose-800 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                  title="Dismiss notice (won't show again)"
                  aria-label="Dismiss notice"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Admin Action Alert: Pending Organizer Applications */}
          {isAdmin && adminRequestsCount > 0 && (
            <div className="bg-[#fff8eb] border border-[#fde0ad] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FCA311] text-[#14213D] flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                  🔔
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#14213D]">
                      {adminRequestsCount} Pending Organizer Application{adminRequestsCount > 1 ? 's' : ''}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FCA311] text-[#14213D]">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Students have applied for Organizer access for BAUST campus clubs and need your approval.
                  </p>
                </div>
              </div>
              <Link
                to="/users?tab=requests"
                className="px-4 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap self-end sm:self-auto"
              >
                Review Requests &rarr;
              </Link>
            </div>
          )}

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Events */}
            <div className="bg-white rounded-xl shadow-xs border border-[#E5E5E5] hover:border-[#FCA311] p-5 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Events</span>
                <div className="p-2 bg-[#14213D] text-[#FCA311] rounded-lg ring-1 ring-[#FCA311]/30 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-[#14213D]">
                  {isOrganizer ? `${myEvents.length} Created` : '4 Active'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {isOrganizer ? `Linked to ${user?.clubAffiliation || 'your club'}` : 'Upcoming campus events'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                {isOrganizer ? (
                  <button
                    type="button"
                    onClick={() => handleTabChange('manage-events')}
                    className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Manage my events</span>
                    <span>&rarr;</span>
                  </button>
                ) : (
                  <Link to="/events" className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition">
                    <span>View calendar</span>
                    <span>&rarr;</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Card 2: Registrations / Organizers */}
            <div className="bg-white rounded-xl shadow-xs border border-[#E5E5E5] hover:border-[#FCA311] p-5 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin ? 'Organizers' : isOrganizer ? 'Queue' : 'Registrations'}
                </span>
                <div className="p-2 bg-[#FCA311]/20 text-[#14213D] rounded-lg ring-1 ring-[#FCA311]/40 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-[#14213D]">
                  {isAdmin
                    ? `${organizersCount} Approved`
                    : isOrganizer
                    ? `${pendingRegistrations.length} Pending`
                    : `${myRegistrations.length} ${myRegistrations.length === 1 ? 'Pass' : 'Passes'}`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {isAdmin
                    ? 'Active club organizers'
                    : isOrganizer
                    ? 'Applications to review'
                    : 'Confirmed digital passes'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                {isAdmin ? (
                  <a
                    href="#organizers-directory"
                    className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition"
                  >
                    <span>View directory</span>
                    <span>&darr;</span>
                  </a>
                ) : isOrganizer ? (
                  <button
                    type="button"
                    onClick={() => handleTabChange('pending-registrations')}
                    className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Review registrations</span>
                    <span>&rarr;</span>
                  </button>
                ) : (
                  <a
                    href="#my-tickets-section"
                    className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition"
                  >
                    <span>View my passes ({myRegistrations.length})</span>
                    <span>&darr;</span>
                  </a>
                )}
              </div>
            </div>

            {/* Card 3: Role & Access */}
            <div className="bg-white rounded-xl shadow-xs border border-[#E5E5E5] hover:border-[#FCA311] p-5 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Access Level</span>
                <div className="p-2 bg-[#14213D] text-[#FCA311] rounded-lg ring-1 ring-[#FCA311]/30 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-[#14213D] capitalize">{user?.role || 'User'}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Organizer: <span className="capitalize">{user?.organizerStatus || 'None'}</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                <Link to="/profile" className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition">
                  <span>Manage privileges</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Card 4: Finances or Cohort */}
            <div className="bg-white rounded-xl shadow-xs border border-[#E5E5E5] hover:border-[#FCA311] p-5 hover:shadow-md transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin || isOrganizer ? 'Finances' : 'Cohort'}
                </span>
                <div className="p-2 bg-[#FCA311] text-[#14213D] rounded-lg shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-[#14213D]">
                  {isAdmin || isOrganizer
                    ? 'Ledger'
                    : user?.batch
                    ? `${user.batch}`
                    : 'Not Set'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {isAdmin || isOrganizer
                    ? 'Event ledgers & funds'
                    : `Level ${user?.level || '-'}, Term ${user?.term || '-'}`}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                <Link
                  to={isAdmin || isOrganizer ? '/finances' : '/profile'}
                  className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] flex items-center gap-1 transition"
                >
                  <span>{isAdmin || isOrganizer ? 'Open finance portal' : 'Update cohort'}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ADMIN ONLY: Club Organizers Directory Section */}
          {isAdmin && (
            <div id="organizers-directory">
              <ClubOrganizersDirectory
                onNotify={(msg, type) => {
                  showToast(msg, type);
                  fetchAdminOrganizersCount();
                }}
              />
            </div>
          )}

          {/* PARTICIPANT DASHBOARD: My Registered Events & Digital Passes */}
          {!isOrganizer && !isAdmin && (
            <div id="my-tickets-section" className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#14213D]">My Registered Passes & Tickets</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14213D] text-[#FCA311]">
                      {myRegistrations.length} {myRegistrations.length === 1 ? 'Pass' : 'Passes'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your official university event passes with cryptographically signed QR codes for gate check-in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchMyRegistrations}
                  disabled={loadingMyRegistrations}
                  className="self-start sm:self-auto px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className={loadingMyRegistrations ? 'animate-spin' : ''}>🔄</span>
                  <span>Refresh Passes</span>
                </button>
              </div>

              {loadingMyRegistrations ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading your registered passes...</span>
                </div>
              ) : myRegistrations.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                    🎟️
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No event passes issued yet</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                    When you register for workshops, hackathons, or seminars below, your printable digital pass and QR code will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myRegistrations.map((reg) => {
                    const isPast = Boolean(reg.isPastEvent) || isEventPast(reg.eventDate, reg.eventTime);
                    const isAttended = Boolean(reg.attended);

                    return (
                      <div
                        key={reg.id}
                        className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 hover:border-[#FCA311] shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-3.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {reg.eventCategory || 'Campus Event'}
                            </span>

                            {/* Intelligent Status Badge */}
                            {isAttended ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                Attended ✓
                              </span>
                            ) : reg.status === 'rejected' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                Rejected
                              </span>
                            ) : isPast ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300"
                                title="Event date has passed"
                              >
                                {reg.status === 'pending' || reg.status === 'expired'
                                  ? 'Expired (Event Ended)'
                                  : 'Event Ended'}
                              </span>
                            ) : reg.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Confirmed Pass
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Pending Review
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-[#14213D] line-clamp-1 leading-snug">
                            {reg.eventTitle || 'BAUST Event'}
                          </h4>

                          <div className="text-[11px] text-slate-500 mt-1.5 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span>📅</span>
                              <span className="font-medium text-slate-700">
                                {formatPassDate(reg.eventDate)}
                              </span>
                              {isPast && (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Ended
                                </span>
                              )}
                            </div>
                            {reg.eventVenue && (
                              <div className="flex items-center gap-1.5 truncate">
                                <span>📍</span>
                                <span className="truncate">{reg.eventVenue}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                              Ticket Code
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-700 truncate block">
                              {reg.ticketCode}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewTicketPass(reg)}
                            disabled={loadingTicketPassId === reg.id}
                            className="px-3.5 py-1.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            <span>🎟️</span>
                            <span>{loadingTicketPassId === reg.id ? 'Loading...' : 'View Pass'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PARTICIPANT DASHBOARD: Live Student Event Feed */}
          {!isOrganizer && !isAdmin && (
            <div id="participant-event-feed" className="space-y-6">
              <StudentEventFeed
                title="Student Event Feed"
                subtitle="Explore upcoming campus workshops, coding competitions, sports matches, and cultural club activities."
              />
            </div>
          )}

          {/* Featured Campus Highlights (for Organizers & Admins) */}
          {(isOrganizer || isAdmin) && (
            <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#14213D]">Campus Event Highlights</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upcoming flagships scheduled at BAUST</p>
                </div>
                <Link to="/events" className="text-xs font-semibold text-[#14213D] hover:text-[#FCA311] transition">
                  View All Events &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#E5E5E5] bg-slate-50/70 hover:border-[#FCA311] transition">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded bg-[#14213D] text-[#FCA311] mb-2">
                    Technology
                  </span>
                  <h4 className="text-sm font-bold text-[#14213D]">BAUST CSE Fest 2026</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hackathon, competitive programming, project display, and gaming tournaments.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <span>Nov 20, 2026</span>
                    <span>•</span>
                    <span>Central Auditorium</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5E5] bg-slate-50/70 hover:border-[#FCA311] transition">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded bg-[#FCA311] text-[#14213D] mb-2">
                    Sports
                  </span>
                  <h4 className="text-sm font-bold text-[#14213D]">Inter-Department Cricket Tournament</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Annual championship clash between engineering and business faculties.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <span>Dec 05, 2026</span>
                    <span>•</span>
                    <span>Main Campus Ground</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5E5] bg-slate-50/70 hover:border-[#FCA311] transition">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded bg-[#14213D] text-[#FCA311] mb-2">
                    Cultural
                  </span>
                  <h4 className="text-sm font-bold text-[#14213D]">BAUST Cultural Gala Night</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Music, drama, arts exhibition, and award ceremony honoring student achievements.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <span>Dec 18, 2026</span>
                    <span>•</span>
                    <span>Open Air Stage</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Organizer Rejection Reason Modal */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <span>⚠️</span>
                <h3>Reject Event Registration</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to reject the registration of{' '}
                <span className="font-semibold text-slate-800">{rejectingReg.participantName}</span> for{' '}
                <span className="font-semibold text-slate-800">{rejectingReg.eventTitle}</span>?
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for rejection (optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. bKash transaction ID invalid, duplicate ticket application..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectingReg(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingRegId === rejectingReg.id}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {processingRegId === rejectingReg.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Student Digital Pass / Ticket Modal */}
      {activeTicketData && (
        <DigitalTicketModal
          ticketData={activeTicketData}
          onClose={() => setActiveTicketData(null)}
        />
      )}
    </div>
  );
}
