import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import eventService from '../services/eventService.js';

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreateEvent = user?.role === 'organizer' || isAdmin;

  // Active Tab for Admin
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'

  // Events state
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Reject Modal State
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    capacity: 100,
    fee: 0,
    items: {
      food: false,
      tshirt: false,
    },
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchApprovedEvents = useCallback(async () => {
    try {
      const data = await eventService.getApprovedEvents();
      setApprovedEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load approved events');
    }
  }, []);

  const fetchPendingEvents = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await eventService.getAdminQueue();
      setPendingEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch admin pending queue:', err);
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchApprovedEvents(), fetchPendingEvents()]);
    setLoading(false);
  }, [fetchApprovedEvents, fetchPendingEvents]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('item_')) {
      const itemKey = name.replace('item_', '');
      setFormData((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [itemKey]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue.trim(),
        capacity: Number(formData.capacity),
        fee: Number(formData.fee),
        items: {
          food: Boolean(formData.items.food),
          tshirt: Boolean(formData.items.tshirt),
        },
      };

      await eventService.createEvent(payload);
      setIsModalOpen(false);
      setFormData(initialFormState);
      showToast('Event submitted successfully! It is now pending administrative approval.');
      loadAll();
    } catch (err) {
      setFormError(
        err.response?.data?.error?.message ||
          (err.response?.data?.error?.details
            ? err.response.data.error.details.map((d) => d.message).join(', ')
            : err.message) ||
          'Failed to create event'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Approval Action
  const handleApproveEvent = async (eventId) => {
    try {
      setProcessingStatus(true);
      await eventService.updateEventStatus(eventId, { status: 'approved' });
      showToast('Event approved successfully and published to catalog!');
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to approve event');
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
      showToast('Event has been rejected.');
      setRejectingEvent(null);
      setRejectionReason('');
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to reject event');
    } finally {
      setProcessingStatus(false);
    }
  };

  const activeEventList = activeTab === 'pending' ? pendingEvents : approvedEvents;

  const filteredEvents = activeEventList.filter((ev) => {
    const term = searchTerm.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(term) ||
      ev.venue?.toLowerCase().includes(term) ||
      ev.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">University Events</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse upcoming workshops, campus seminars, cultural galas, and tournaments.
          </p>
        </div>

        {canCreateEvent && (
          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Event</span>
          </button>
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
            <span>Approved Events</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              {approvedEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingEvents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
                {pendingEvents.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'pending'
                ? 'Search pending event requests...'
                : 'Search events by title, venue, or keyword...'
            }
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">
            {activeTab === 'pending' ? 'Loading review queue...' : 'Loading events...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <h3 className="text-base font-semibold text-rose-900">Failed to load events</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            onClick={loadAll}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-bold text-slate-800">
            {activeTab === 'pending' ? 'No pending events in review queue' : 'No events found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'pending'
              ? 'Great work! All submitted events have been reviewed.'
              : searchTerm
              ? `No events match your search query "${searchTerm}".`
              : 'There are currently no approved public events scheduled. Check back soon!'}
          </p>
          {canCreateEvent && activeTab === 'approved' && !searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Create the First Event
            </button>
          )}
        </div>
      )}

      {/* Pending Events Review List (Admin Tab) */}
      {!loading && !error && activeTab === 'pending' && filteredEvents.length > 0 && (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Pending Review
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Creator ID: {event.createdBy}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{event.description || 'No description provided.'}</p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                  <span>📅 {event.date} ({event.startTime} - {event.endTime})</span>
                  <span>📍 {event.venue}</span>
                  <span>👥 Capacity: {event.capacity} seats</span>
                  <span>💵 Fee: {Number(event.fee) === 0 ? 'Free' : `৳ ${event.fee}`}</span>
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

      {/* Approved Events Responsive Grid */}
      {!loading && !error && activeTab === 'approved' && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isFree = Number(event.fee) === 0;
            const regCount = event.registeredCount || 0;
            const capacity = event.capacity || 100;
            const capacityPercent = Math.min(100, Math.round((regCount / capacity) * 100));

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Event Card Header */}
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isFree ? 'Free Admission' : `Fee: ৳ ${event.fee}`}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded">
                      {event.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 leading-snug line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {event.description || 'No description provided.'}
                  </p>

                  {/* Metadata List */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {event.date} • {event.startTime} - {event.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  {/* Included Items Badges */}
                  {(event.items?.food || event.items?.tshirt) && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2">
                      {event.items?.food && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                          🍱 Food Included
                        </span>
                      )}
                      {event.items?.tshirt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                          👕 T-Shirt Included
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Capacity & Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1.5">
                    <span>Attendance Capacity</span>
                    <span>
                      {regCount} / {capacity} seats ({capacityPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        capacityPercent >= 90 ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>

                  <div className="mt-3.5">
                    <Link
                      to={`/events/${event.id}`}
                      className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      View Details & Register
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Rejection Modal */}
      {rejectingEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800">Reject Event Submission</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide constructive feedback for rejecting <span className="font-semibold text-slate-700">{rejectingEvent.title}</span>.
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingEvent(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingStatus}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {processingStatus ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Create New Event</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submissions will be routed to campus administrators for approval.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. BAUST Tech Olympiad 2026"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide schedule details, eligibility rules, and instructions..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    required
                    value={formData.venue}
                    onChange={handleInputChange}
                    placeholder="e.g. Central Auditorium / Lab 3"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    name="capacity"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Fee (BDT)</label>
                <input
                  type="number"
                  name="fee"
                  min="0"
                  value={formData.fee}
                  onChange={handleInputChange}
                  placeholder="0 for free events"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
                <span className="block text-xs font-semibold text-slate-700 mb-2">Items Provided for Attendees</span>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="item_food"
                      checked={formData.items.food}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Food / Meal</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="item_tshirt"
                      checked={formData.items.tshirt}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Event T-Shirt</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
