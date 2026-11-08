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
      const params = {};
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center gap-1.5"
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
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline ml-auto"
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
