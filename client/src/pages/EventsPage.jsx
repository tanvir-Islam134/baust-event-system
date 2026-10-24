import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import eventService from '../services/eventService.js';
import StudentEventFeed from '../components/events/StudentEventFeed.jsx';

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreateEvent = user?.role === 'organizer' || isAdmin;

  // Active Tab for Admin
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'

  // Admin Pending Events state
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Reject Modal State
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  const fetchPendingEvents = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoadingPending(true);
      const data = await eventService.getAdminQueue();
      setPendingEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch admin pending queue:', err);
    } finally {
      setLoadingPending(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchPendingEvents();
  }, [fetchPendingEvents]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Admin Approval Action
  const handleApproveEvent = async (eventId) => {
    try {
      setProcessingStatus(true);
      await eventService.updateEventStatus(eventId, { status: 'approved' });
      showToast('Event approved successfully and published to student feed!');
      await fetchPendingEvents();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to approve event');
    } finally {
      setProcessingStatus(false);
    }
  };

  // Admin Reject Action
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this event.');
      return;
    }

    try {
      setProcessingStatus(true);
      await eventService.updateEventStatus(rejectingEvent.id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      showToast('Event rejected with feedback provided to club organizer.');
      setRejectingEvent(null);
      setRejectionReason('');
      await fetchPendingEvents();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to reject event');
    } finally {
      setProcessingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 text-sm font-medium">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Events Portal</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse upcoming workshops, campus seminars, cultural galas, and athletic tournaments.
          </p>
        </div>

        {canCreateEvent && (
          <Link
            to="/dashboard?tab=create-event"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition whitespace-nowrap self-start sm:self-auto"
          >
            <span>➕</span>
            <span>Create New Event</span>
          </Link>
        )}
      </div>

      {/* Admin Tabs Toggle */}
      {isAdmin && (
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'approved'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Approved Events (Student Feed)</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Review Queue</span>
            {pendingEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
                {pendingEvents.length} Pending
              </span>
            )}
          </button>
        </div>
      )}

      {/* Admin Review Queue Tab */}
      {isAdmin && activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Pending events awaiting administrator review and approval:</span>
            <button
              onClick={fetchPendingEvents}
              disabled={loadingPending}
              className="text-blue-600 hover:underline font-semibold"
            >
              Refresh Queue
            </button>
          </div>

          {loadingPending && (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500">Loading pending event submissions...</p>
            </div>
          )}

          {!loadingPending && pendingEvents.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xl mb-2">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-800">Queue is Clear!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All submitted events have been reviewed and approved.
              </p>
            </div>
          )}

          {!loadingPending && pendingEvents.length > 0 && (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending Review
                      </span>
                      <span className="text-xs text-indigo-700 font-semibold">
                        🏛️ {event.clubName || 'Assigned Club'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {event.description || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                      <span>📅 {event.date} ({event.time || event.startTime})</span>
                      <span>📍 {event.venue}</span>
                      <span>👥 Capacity: {event.capacity} seats</span>
                      <span>
                        💵 Fee:{' '}
                        {Number(event.ticketPrice || event.fee) === 0
                          ? 'Free'
                          : `৳ ${event.ticketPrice || event.fee}`}
                      </span>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                    <button
                      disabled={processingStatus}
                      onClick={() => handleApproveEvent(event.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      Approve Event
                    </button>
                    <button
                      disabled={processingStatus}
                      onClick={() => {
                        setRejectingEvent(event);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      Reject...
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student / Participant Live Event Feed */}
      {(!isAdmin || activeTab === 'approved') && (
        <StudentEventFeed
          title="Campus Event Feed"
          subtitle="Explore all official workshops, competitions, cultural galas, and tournaments organized across BAUST."
        />
      )}

      {/* Admin Rejection Modal */}
      {rejectingEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800">Reject Event Submission</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide constructive feedback for rejecting{' '}
              <span className="font-semibold text-slate-700">{rejectingEvent.title}</span>.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Venue is reserved for university convocations on this date..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingEvent(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingStatus}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
