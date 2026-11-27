import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import eventService from '../services/eventService.js';
import EventCalendar from '../components/calendar/EventCalendar.jsx';

export default function CalendarPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'organizer';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedClub, setSelectedClub] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const categories = useMemo(
    () => ['Tech', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Competition', 'General'],
    []
  );

  const fetchCalendarEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { status: 'approved' };
      if (selectedClub !== 'all') params.clubName = selectedClub;
      if (selectedCategory !== 'all') params.category = selectedCategory;

      let data;
      try {
        data = await eventService.getCalendarEvents(params);
      } catch {
        // Fallback to getApprovedEvents if custom calendar endpoint is unreachable
        data = await eventService.getApprovedEvents(params);
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to load calendar events.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedClub, selectedCategory]);

  useEffect(() => {
    fetchCalendarEvents();

    let socket = null;
    let isMounted = true;

    // Listen for real-time approvals so approved events appear on calendar instantly
    import('socket.io-client')
      .then(({ io }) => {
        if (!isMounted || !io) return;
        if (
          typeof window !== 'undefined' &&
          !window.location.hostname.includes('localhost') &&
          !import.meta.env.VITE_SERVER_URL
        ) {
          return;
        }
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        socket = io(socketUrl, { withCredentials: true, autoConnect: true });

        socket.on('event_status_updated', (data) => {
          if (data?.status === 'approved' && isMounted) {
            fetchCalendarEvents();
          }
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [fetchCalendarEvents]);

  // Dynamically extract all available clubs from returned events
  const availableClubs = useMemo(() => {
    const clubSet = new Set(defaultClubs);
    events.forEach((ev) => {
      const c = ev.clubName || ev.clubAffiliation;
      if (c && typeof c === 'string') clubSet.add(c.trim());
    });
    return Array.from(clubSet);
  }, [events, defaultClubs]);

  return (
    <div className="space-y-6">
      {/* Header Actions & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14213D] border border-[#FCA311]/40 text-[#FCA311] text-xs font-bold">
            <span>📅</span>
            <span>Interactive Campus Calendar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Events & Venues Calendar</h1>
          <p className="text-sm text-slate-500">
            Explore schedules by month, week, or chronological agenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick link to standard catalog */}
          <Link
            to="/events"
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
          >
            &larr; Standard Event Catalog
          </Link>

          {isStaff && (
            <Link
              to="/dashboard?tab=create-event"
              className="px-4 py-2 text-xs font-black rounded-lg bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] transition shadow-md shadow-[#FCA311]/20 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Schedule Event</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-club" className="font-semibold text-slate-700">Filter Club:</label>
          <select
            id="filter-club"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
          >
            <option value="all">All Clubs</option>
            {availableClubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-category" className="font-semibold text-slate-700">Category:</label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {(selectedClub !== 'all' || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSelectedClub('all');
              setSelectedCategory('all');
            }}
            className="text-xs font-bold text-[#14213D] hover:text-[#FCA311] underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchCalendarEvents}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Event Calendar Component */}
      <EventCalendar events={events} loading={loading} />
    </div>
  );
}
