import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import registrationService from '../services/registrationService.js';
import DigitalTicketModal from '../components/events/DigitalTicketModal.jsx';

export default function MyEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'upcoming' | 'past' | 'confirmed' | 'pending'

  // Digital Ticket Pass Modal State
  const [activeTicketData, setActiveTicketData] = useState(null);
  const [loadingTicketPassId, setLoadingTicketPassId] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await registrationService.getMyRegistrations();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch user registrations:', err);
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to load your registered events. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleViewTicketPass = async (e, reg) => {
    e.stopPropagation(); // Don't trigger card navigation
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
        },
        attendee: {
          name: user?.name || 'Attendee',
          email: user?.email || '',
        },
      });
    } finally {
      setLoadingTicketPassId(null);
    }
  };

  const isEventPast = (dateStr, timeStr) => {
    if (!dateStr) return false;
    try {
      const cleanDate = String(dateStr).slice(0, 10);
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const eventEnd = new Date(y, m - 1, d, 23, 59, 59);
        return eventEnd.getTime() < Date.now();
      }
      return new Date(dateStr).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = registrations.length;
    let upcoming = 0;
    let past = 0;
    let confirmed = 0;
    let pending = 0;

    registrations.forEach((r) => {
      const isPast = Boolean(r.isPastEvent) || isEventPast(r.eventDate, r.eventTime);
      if (isPast) {
        past++;
      } else {
        upcoming++;
      }
      if (r.status === 'approved') confirmed++;
      if (r.status === 'pending' || r.status === 'Pending Payment Verification') pending++;
    });

    return { total, upcoming, past, confirmed, pending };
  }, [registrations]);

  // Filtered & Sorted list (upcoming first, then past)
  const filteredRegistrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matches = registrations.filter((reg) => {
      const past = Boolean(reg.isPastEvent) || isEventPast(reg.eventDate, reg.eventTime);

      // Status filter tab
      if (statusFilter === 'upcoming' && past) return false;
      if (statusFilter === 'past' && !past) return false;
      if (statusFilter === 'confirmed' && reg.status !== 'approved') return false;
      if (
        statusFilter === 'pending' &&
        reg.status !== 'pending' &&
        reg.status !== 'Pending Payment Verification'
      ) {
        return false;
      }

      // Search query
      if (query) {
        const title = (reg.eventTitle || '').toLowerCase();
        const venue = (reg.eventVenue || '').toLowerCase();
        const club = (reg.clubName || '').toLowerCase();
        const ticket = (reg.ticketCode || '').toLowerCase();
        if (
          !title.includes(query) &&
          !venue.includes(query) &&
          !club.includes(query) &&
          !ticket.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort upcoming first (by date ascending), past below (by date descending)
    return matches.sort((a, b) => {
      const aPast = Boolean(a.isPastEvent) || isEventPast(a.eventDate, a.eventTime);
      const bPast = Boolean(b.isPastEvent) || isEventPast(b.eventDate, b.eventTime);

      if (!aPast && bPast) return -1;
      if (aPast && !bPast) return 1;

      if (!aPast && !bPast) {
        return (a.eventDate || '').localeCompare(b.eventDate || '');
      }
      return (b.eventDate || '').localeCompare(a.eventDate || '');
    });
  }, [registrations, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E5E5E5] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14213D] border border-[#FCA311]/40 text-[#FCA311] text-xs font-bold mb-2.5 shadow-xs">
              <span>🎟️ My Campus Life</span>
              <span>•</span>
              <span>Registered Events</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] tracking-tight">
              My Events
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">
              Manage your registered event participations, access cryptographically signed gate passes, and view event schedules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              onClick={fetchRegistrations}
              disabled={loading}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Refresh registered events list"
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
              <span>Refresh</span>
            </button>

            <Link
              to="/events"
              className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs font-black shadow-md shadow-[#FCA311]/20 transition flex items-center justify-center gap-1.5"
            >
              <span>🔍</span>
              <span>Explore More Events</span>
            </Link>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Registered
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#14213D] block mt-0.5">
              {stats.total}
            </span>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Confirmed Passes
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-800 block mt-0.5">
              {stats.confirmed}
            </span>
          </div>

          <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Upcoming Events
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-800 block mt-0.5">
              {stats.upcoming}
            </span>
          </div>

          <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Past / Completed
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-800 block mt-0.5">
              {stats.past}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E5E5E5] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'upcoming', label: `Upcoming (${stats.upcoming})` },
            { id: 'past', label: `Past (${stats.past})` },
            { id: 'confirmed', label: `Confirmed (${stats.confirmed})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#14213D] text-[#FCA311] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, venue, or ticket code..."
            className="w-full pl-8 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading your registered events...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-rose-900">Failed to load events</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchRegistrations}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRegistrations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#FCA311] flex items-center justify-center text-3xl mx-auto shadow-inner">
            🎟️
          </div>
          <h3 className="text-lg font-bold text-[#14213D]">No Registered Events Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'all'
              ? 'No registered events match your current filter. Try clearing the search or switching filter tabs.'
              : "You haven't registered for any campus events yet. Explore upcoming hackathons, tech fests, athletic meets, and workshops!"}
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="px-4 py-2.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-1.5"
            >
              <span>Explore Campus Events</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Registered Events Grid */}
      {!loading && !error && filteredRegistrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegistrations.map((reg) => {
            const isPast = Boolean(reg.isPastEvent) || isEventPast(reg.eventDate, reg.eventTime);
            const isAttended = Boolean(reg.attended);
            const hostingClub = reg.clubName || 'BAUST Student Club';

            return (
              <div
                key={reg.id}
                onClick={() => navigate(`/events/${reg.eventId}`)}
                className={`bg-white rounded-2xl shadow-xs border border-[#E5E5E5] hover:border-[#FCA311] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer ${
                  isPast ? 'opacity-85' : ''
                }`}
                title="Click to view event details"
              >
                <div>
                  {/* Card Banner Header */}
                  <div className="relative h-40 w-full bg-[#14213D] overflow-hidden">
                    {reg.eventBannerUrl ? (
                      <img
                        src={reg.eventBannerUrl}
                        alt={reg.eventTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#14213D] via-[#1b2b4d] to-black flex flex-col items-center justify-center p-4 text-center relative">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl mb-1 text-[#FCA311] border border-white/10">
                          🏛️
                        </div>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider line-clamp-1">
                          {hostingClub}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Badges on Banner */}
                    <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#14213D]/90 text-white backdrop-blur-md border border-white/20 shadow-xs truncate max-w-[65%]">
                        <span>🏛️</span>
                        <span className="truncate">{hostingClub}</span>
                      </span>

                      {/* Status Badge */}
                      {isAttended ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-xs">
                          Attended ✓
                        </span>
                      ) : reg.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                          Rejected
                        </span>
                      ) : isPast ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-700 text-slate-200 border border-slate-500 shadow-xs">
                          Concluded
                        </span>
                      ) : reg.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                          Confirmed Pass ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-[#14213D] shadow-xs">
                          {reg.status === 'Pending Payment Verification'
                            ? 'Pending Payment Verification'
                            : 'Pending Review'}
                        </span>
                      )}
                    </div>

                    {/* Ticket Code Tag on bottom of banner */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/95 pointer-events-none">
                      <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded font-mono font-bold text-xs tracking-wider text-[#FCA311]">
                        {reg.ticketCode}
                      </span>
                      {reg.eventCategory && (
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold">
                          {reg.eventCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-[#14213D] group-hover:text-[#FCA311] transition-colors line-clamp-2 leading-snug">
                      {reg.eventTitle || 'BAUST Event'}
                    </h3>

                    {/* Schedule & Venue Meta */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[#14213D]">📅</span>
                        <span className="font-bold text-[#14213D]">
                          {formatDate(reg.eventDate)}
                        </span>
                        {reg.eventTime && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[#FCA311]">⏰</span>
                            <span>{reg.eventTime}</span>
                          </>
                        )}
                      </div>

                      {reg.eventVenue && (
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-rose-500 flex-shrink-0">📍</span>
                          <span className="truncate">{reg.eventVenue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center gap-2">
                  <Link
                    to={`/events/${reg.eventId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-3 text-center bg-slate-100 hover:bg-[#14213D] hover:text-[#FCA311] text-[#14213D] rounded-xl text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Event Details</span>
                    <span>&rarr;</span>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleViewTicketPass(e, reg)}
                    disabled={loadingTicketPassId === reg.id}
                    className="py-2 px-3.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    title="Open cryptographically signed digital pass"
                  >
                    <span>🎟️</span>
                    <span>{loadingTicketPassId === reg.id ? 'Loading...' : 'Pass'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Ticket Modal */}
      {activeTicketData && (
        <DigitalTicketModal
          ticketData={activeTicketData}
          onClose={() => setActiveTicketData(null)}
        />
      )}
    </div>
  );
}
