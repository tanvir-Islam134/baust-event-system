import React, { useState, useEffect, useCallback } from 'react';
import eventService from '../../services/eventService.js';

export default function AdminEventReviewQueue({ onEventReviewed }) {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Decline Modal State
  const [decliningEvent, setDecliningEvent] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchPendingEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getAdminQueue();
      setPendingEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load pending queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingEvents();

    let socket = null;
    let isMounted = true;

    import('socket.io-client')
      .then(({ io }) => {
        if (!isMounted || !io) return;
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        socket = io(socketUrl, { withCredentials: true, autoConnect: true });

        socket.on('new_event_request', () => {
          if (isMounted) fetchPendingEvents();
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [fetchPendingEvents]);

  const handleApprove = async (event) => {
    try {
      setProcessingId(event.id);
      setError(null);
      await eventService.updateEventStatus(event.id, { status: 'approved' });
      setSuccessMsg(`"${event.title || event.eventName}" has been Approved and published to the calendar!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (onEventReviewed) onEventReviewed(event.id, 'approved');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to approve event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDecline = async (e) => {
    e.preventDefault();
    if (!decliningEvent) return;
    if (!declineReason.trim()) {
      alert('Please state a reason for declining this event.');
      return;
    }

    try {
      setProcessingId(decliningEvent.id);
      setError(null);
      await eventService.updateEventStatus(decliningEvent.id, {
        status: 'declined',
        reason: declineReason.trim(),
        rejectionReason: declineReason.trim(),
      });
      setSuccessMsg(`"${decliningEvent.title || decliningEvent.eventName}" has been Declined with feedback sent to the organizer.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setPendingEvents((prev) => prev.filter((e) => e.id !== decliningEvent.id));
      if (onEventReviewed) onEventReviewed(decliningEvent.id, 'declined');
      setDecliningEvent(null);
      setDeclineReason('');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to decline event');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Pending Event Approvals</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingEvents.length} Awaiting Decision
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review event proposals submitted by BAUST club organizers. Approved events are published immediately to the campus calendar.
          </p>
        </div>

        <button
          onClick={fetchPendingEvents}
          disabled={loading}
          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto shadow-xs"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Checking pending event proposals...</p>
        </div>
      )}

      {!loading && pendingEvents.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xl mb-3 shadow-inner">
            ✓
          </div>
          <h3 className="text-base font-bold text-slate-800">Review Queue is Empty!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All submitted events have been reviewed. New proposals submitted by club organizers will appear here in real-time.
          </p>
        </div>
      )}

      {!loading && pendingEvents.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {pendingEvents.map((event) => {
            const ticketPrice = Number(event.ticketPrice || event.fee || 0);
            const isProcessing = processingId === event.id;

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-amber-200/80 hover:border-amber-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:shadow-md"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <span>⏳</span>
                      <span>Pending Approval</span>
                    </span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      🏛️ {event.clubName || event.clubAffiliation || 'Campus Club'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      Category: {event.category || 'General'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {event.title || event.eventName}
                  </h3>

                  {event.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Logistics Information */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      <strong>{event.date || 'TBA'}</strong> ({event.time || event.startTime || '10:00 AM'})
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{event.venue || 'TBA'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>👥</span>
                      <span>Capacity: {event.capacity || 100} seats</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💵</span>
                      <span>Fee: {ticketPrice > 0 ? `৳${ticketPrice}` : 'Free'}</span>
                    </span>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="flex items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0 self-end md:self-center">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(event)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Approve</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      setDecliningEvent(event);
                      setDeclineReason('');
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>✕</span>
                    <span>Decline...</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Feedback Modal */}
      {decliningEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Event Proposal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide constructive feedback for{' '}
                  <strong className="text-slate-700">{decliningEvent.title || decliningEvent.eventName}</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDecline} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Declining <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g., Venue is already reserved for semester final exams on this date. Please reschedule or pick Central Ground."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDecliningEvent(null);
                    setDeclineReason('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === decliningEvent.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
