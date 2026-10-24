import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function OrganizerManageEvents({
  events = [],
  loading = false,
  onRefresh,
  onCreateClick,
}) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  const clubName = user?.clubAffiliation || 'Your Club';

  // Metrics
  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter((e) => e.status === 'pending').length;
    const approved = events.filter((e) => e.status === 'approved').length;
    const rejected = events.filter((e) => e.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [events]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
      const title = (ev.title || ev.eventName || '').toLowerCase();
      const venue = (ev.venue || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || title.includes(query) || venue.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span>✓</span> Approved & Live
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span>⚠️</span> Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>🏁</span> Completed
          </span>
        );
      default: // 'pending'
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span>⏳</span> Pending Admin Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Published Club Events</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {events.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage, monitor approvals, and view participant metrics for events created for{' '}
            <strong className="text-indigo-700 font-semibold">🏛️ {clubName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Refresh event list"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onCreateClick}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>➕</span>
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            All Events
          </span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">{stats.total}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Approved & Live
          </span>
          <span className="text-2xl font-bold text-emerald-700 block mt-1">{stats.approved}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Pending Review
          </span>
          <span className="text-2xl font-bold text-amber-700 block mt-1">{stats.pending}</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
            Rejected
          </span>
          <span className="text-2xl font-bold text-rose-700 block mt-1">{stats.rejected}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'approved', label: `Approved (${stats.approved})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
            { id: 'rejected', label: `Rejected (${stats.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or venue..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Events Grid / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading your published events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
            📅
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {events.length === 0 ? 'No Events Published Yet' : 'No Events Match Filter'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {events.length === 0
              ? `You haven't submitted any campus events for ${clubName} yet. Create your first workshop, tournament, or seminar to get started!`
              : 'Try clearing your search query or switching to the "All" status filter.'}
          </p>
          {events.length === 0 && (
            <div className="mt-5">
              <button
                onClick={onCreateClick}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition inline-flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>Create Your First Event</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const registered = Number(event.registeredCount) || 0;
            const capacity = Number(event.capacity) || 100;
            const percentFilled = Math.min(Math.round((registered / capacity) * 100), 100);
            const ticketPrice =
              event.ticketPrice !== undefined ? event.ticketPrice : event.fee !== undefined ? event.fee : 0;

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col"
              >
                {/* Event Banner Image or Fallback Header */}
                <div className="relative h-40 bg-slate-900 overflow-hidden group">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-3xl mb-1">🏛️</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider line-clamp-1">
                        {event.clubName || clubName}
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div>{getStatusBadge(event.status)}</div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md shadow">
                      {ticketPrice > 0 ? `৳${ticketPrice}` : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Club Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 mb-1.5">
                      <span>🏛️</span>
                      <span className="truncate">{event.clubName || clubName}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {event.title || event.eventName}
                    </h3>

                    {/* Description preview */}
                    {event.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {/* Rejection Alert Callout */}
                    {event.status === 'rejected' && event.rejectionReason && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                        <p className="font-bold flex items-center gap-1 text-[11px]">
                          <span>⚠️</span>
                          <span>Admin Rejection Note:</span>
                        </p>
                        <p className="mt-0.5 text-rose-700 leading-normal">{event.rejectionReason}</p>
                      </div>
                    )}

                    {/* Logistics metadata */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">📅</span>
                        <span>{event.date || 'TBA'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">⏰</span>
                        <span>{event.time || event.startTime || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 flex-shrink-0">📍</span>
                        <span className="truncate">{event.venue || 'TBA'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Capacity Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                        <span>Registration Capacity</span>
                        <span className="font-bold text-slate-700">
                          {registered} / {capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {event.status === 'approved' ? (
                        <Link
                          to={`/events/${event.id}`}
                          className="w-full text-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                        >
                          View Public Page &rarr;
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {event.status === 'pending'
                            ? 'Awaiting review before public listing'
                            : 'Updates require resubmission'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

