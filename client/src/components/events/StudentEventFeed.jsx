import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../../services/eventService.js';

export default function StudentEventFeed({
  title = 'Student Event Feed',
  subtitle = 'Discover campus workshops, tech fests, athletic tournaments, and cultural galas hosted by BAUST student clubs.',
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('all');

  // Predefined known BAUST clubs
  const defaultClubs = useMemo(
    () => [
      'BAUST Computer Club',
      'BAUST Robotics Club',
      'BAUST Cultural Club',
      'BAUST Sports Club',
      'IEEE BAUST Student Branch',
    ],
    []
  );

  // Dynamically extract all available clubs from events plus default clubs
  const availableClubs = useMemo(() => {
    const clubSet = new Set(defaultClubs);
    events.forEach((ev) => {
      const cName = ev.clubName || ev.clubAffiliation;
      if (cName && typeof cName === 'string') {
        clubSet.add(cName.trim());
      }
    });
    return Array.from(clubSet);
  }, [events, defaultClubs]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedClub && selectedClub !== 'all') {
        params.clubName = selectedClub;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const data = await eventService.getApprovedEvents(params);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to load events. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedClub, searchTerm]);

  // Debounced search / filter fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedClub('all');
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

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <span>🎓 Student Experience</span>
            <span>•</span>
            <span>Campus Activities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
        </div>

        {/* Search Bar & Club Category Filters */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
          {/* Top Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by event name, description, venue..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm p-0.5 rounded-full hover:bg-slate-200 transition"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile / Quick Dropdown for Clubs */}
            <div className="sm:hidden">
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🏛️ All Clubs ({events.length})</option>
                {availableClubs.map((club) => (
                  <option key={club} value={club}>
                    🏛️ {club}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Club Category Filter Pills (Desktop Horizontal Bar) */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Filter by Club:
            </span>

            <button
              onClick={() => setSelectedClub('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedClub === 'all'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              🏛️ All Clubs
            </button>

            {availableClubs.map((club) => {
              const isSelected = selectedClub === club;
              return (
                <button
                  key={club}
                  onClick={() => setSelectedClub(club)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {club}
                </button>
              );
            })}
          </div>

          {/* Filter Status & Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div>
              <span>Found </span>
              <strong className="text-slate-800 font-bold">{events.length}</strong>
              <span> {events.length === 1 ? 'event' : 'events'}</span>
              {selectedClub !== 'all' && (
                <span>
                  {' '}
                  hosted by <strong className="text-blue-700">{selectedClub}</strong>
                </span>
              )}
              {searchTerm && (
                <span>
                  {' '}
                  matching &ldquo;<span className="text-slate-800">{searchTerm}</span>&rdquo;
                </span>
              )}
            </div>

            {(selectedClub !== 'all' || searchTerm) && (
              <button
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading student events feed...</p>
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
            onClick={fetchEvents}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🎪
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Events Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {selectedClub !== 'all' || searchTerm
              ? 'No scheduled events match your current filter criteria. Try clearing the search or choosing a different club.'
              : 'There are currently no approved campus events scheduled. Check back soon as club organizers publish new events!'}
          </p>
          {(selectedClub !== 'all' || searchTerm) && (
            <button
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
            >
              <span>View All Campus Events</span>
            </button>
          )}
        </div>
      )}

      {/* Event Cards Grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const ticketPrice =
              event.ticketPrice !== undefined
                ? Number(event.ticketPrice)
                : event.fee !== undefined
                ? Number(event.fee)
                : 0;
            const isFree = ticketPrice === 0;

            const registeredCount = Number(event.registeredCount) || 0;
            const capacity = Number(event.capacity) || 100;
            const percentFilled = Math.min(Math.round((registeredCount / capacity) * 100), 100);

            const hostingClub =
              event.clubName || event.clubAffiliation || 'BAUST Student Organization';

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* 1. Banner Image Header */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.title || event.eventName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl mb-2 border border-white/20 shadow">
                        🏛️
                      </div>
                      <span className="text-xs font-bold text-white tracking-wider uppercase line-clamp-1">
                        {hostingClub}
                      </span>
                      {/* Decorative backdrop glow */}
                      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                    </div>
                  )}

                  {/* Gradient overlay for text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
                    {/* Club Name Badge */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900/85 text-white backdrop-blur-md border border-white/20 shadow-sm truncate max-w-[70%]">
                      <span className="text-xs">🏛️</span>
                      <span className="truncate">{hostingClub}</span>
                    </span>

                    {/* Ticket Price Badge */}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold shadow-md whitespace-nowrap ${
                        isFree
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isFree ? 'Free Admission' : `৳${ticketPrice}`}
                    </span>
                  </div>

                  {/* Capacity indicator tag at bottom of banner */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-white/90 font-medium pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {registeredCount} / {capacity} Registered
                    </span>
                    {event.status && event.status !== 'approved' && (
                      <span className="bg-amber-500/80 backdrop-blur-sm px-2 py-0.5 rounded-md capitalize font-bold text-white">
                        {event.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Event Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Event Title */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {event.title || event.eventName}
                    </h3>

                    {/* Description preview */}
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description ||
                        'Join this flagship university gathering. Click below to view the agenda and register.'}
                    </p>

                    {/* Metadata: Date, Time & Venue */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-base text-blue-600 flex-shrink-0">📅</span>
                        <span className="font-semibold">{formatDate(event.date)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-indigo-600 flex-shrink-0">⏰</span>
                        <span>{event.time || event.startTime || 'TBA'}</span>
                      </div>

                      {/* Venue */}
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base text-rose-500 flex-shrink-0">📍</span>
                        <span className="truncate text-slate-600 font-medium">
                          {event.venue || 'Central Campus, BAUST'}
                        </span>
                      </div>
                    </div>

                    {/* Included Perks / Items (if food or tshirt) */}
                    {(event.items?.food || event.items?.tshirt) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                        {event.items?.food && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                            🍲 Refreshments Included
                          </span>
                        )}
                        {event.items?.tshirt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                            👕 Official T-Shirt
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Card Footer with "View Details & Register" button */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Capacity Progress Bar */}
                    <div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentFilled >= 90 ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* View Details & Register Button */}
                    <Link
                      to={`/events/${event.id}`}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <span>View Details & Register</span>
                      <svg
                        className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
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

