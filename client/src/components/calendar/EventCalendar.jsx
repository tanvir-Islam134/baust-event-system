import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

/**
 * Category styling definitions for distinct color-coding.
 */
export const CATEGORY_COLORS = {
  Tech: { bg: '#4f46e5', border: '#4338ca', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  Technology: { bg: '#4f46e5', border: '#4338ca', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  Hackathon: { bg: '#6366f1', border: '#4f46e5', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  Workshop: { bg: '#0284c7', border: '#0369a1', badge: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  Seminar: { bg: '#0d9488', border: '#0f766e', badge: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  Cultural: { bg: '#d97706', border: '#b45309', badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  Sports: { bg: '#16a34a', border: '#15803d', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  Competition: { bg: '#7c3aed', border: '#6d28d9', badge: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  General: { bg: '#2563eb', border: '#1d4ed8', badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
};

export const getCategoryConfig = (category) => {
  const norm = (category || 'General').trim();
  const matchedKey = Object.keys(CATEGORY_COLORS).find(
    (k) => k.toLowerCase() === norm.toLowerCase()
  );
  return matchedKey ? CATEGORY_COLORS[matchedKey] : CATEGORY_COLORS.General;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 600;
  const ampm = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10) || 0;
    if (ampm[3] && ampm[3].toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm[3] && ampm[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + (parseInt(match24[2], 10) || 0);
  }
  return 600;
};

export default function EventCalendar({ events = [], loading = false }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'organizer';

  // View state: 'calendar' (Month/Week/Day) or 'agenda' (Summarized List View)
  const [activeViewMode, setActiveViewMode] = useState('calendar');
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Transform raw events to BigCalendar format with start and end Date objects
  const calendarEvents = useMemo(() => {
    return events.map((ev) => {
      const dateStr = ev.date ? String(ev.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const [year, month, day] = dateStr.split('-').map(Number);

      const startMinutes = parseTimeToMinutes(ev.startTime || ev.time);
      let endMinutes = ev.endTime ? parseTimeToMinutes(ev.endTime) : startMinutes + 120;
      if (endMinutes <= startMinutes) {
        endMinutes = startMinutes + 120;
      }

      const start = new Date(year, (month || 1) - 1, day || 1, Math.floor(startMinutes / 60), startMinutes % 60);
      const end = new Date(year, (month || 1) - 1, day || 1, Math.floor(endMinutes / 60), endMinutes % 60);

      return {
        id: ev.id,
        title: ev.title || ev.eventName || 'Untitled Event',
        start,
        end,
        category: ev.category || 'General',
        venue: ev.venue || 'TBA',
        timeStr: ev.time || ev.startTime || '10:00 AM',
        endTimeStr: ev.endTime || '',
        clubName: ev.clubName || ev.clubAffiliation || 'Central BAUST',
        hasConflict: Boolean(ev.hasConflict),
        conflictReasons: ev.conflictReasons || [],
        conflictingWith: ev.conflictingWith || [],
        original: ev,
      };
    });
  }, [events]);

  // Dynamic styling for calendar events
  // If user is admin/organizer and event has conflict -> RED (#dc2626)
  // Otherwise -> Distinct category color
  const eventPropGetter = (event) => {
    if (isStaff && event.hasConflict) {
      return {
        style: {
          backgroundColor: '#dc2626',
          borderColor: '#991b1b',
          color: '#ffffff',
          fontWeight: '600',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.35)',
        },
        className: 'border-l-4 border-l-red-900',
      };
    }

    const catStyle = getCategoryConfig(event.category);
    return {
      style: {
        backgroundColor: catStyle.bg,
        borderColor: catStyle.border,
        color: '#ffffff',
        fontWeight: '500',
        borderRadius: '6px',
      },
    };
  };

  // Custom Event bar content in Calendar grid
  const CustomEvent = ({ event }) => {
    return (
      <div className="flex items-center gap-1 truncate px-1 py-0.5 text-xs">
        {isStaff && event.hasConflict && (
          <span className="flex-shrink-0 bg-white/90 text-red-700 text-[10px] font-extrabold px-1 rounded leading-tight shadow-xs">
            CONFLICT
          </span>
        )}
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  // Sorted list for Agenda View
  const sortedAgendaEvents = useMemo(() => {
    return [...calendarEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [calendarEvents]);

  // Conflict summary for admins / organizers
  const totalConflicts = useMemo(() => {
    return calendarEvents.filter((e) => e.hasConflict).length;
  }, [calendarEvents]);

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Campus Calendar
            </span>
            {isStaff && totalConflicts > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1 animate-pulse">
                <span>⚠️</span>
                <span>{totalConflicts} Schedule Conflict{totalConflicts > 1 ? 's' : ''} Detected</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">BAUST Event Schedule</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View academic, athletic, and cultural event timelines across campus venues.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveViewMode('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeViewMode === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Full Calendar View</span>
          </button>

          <button
            onClick={() => setActiveViewMode('agenda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeViewMode === 'agenda'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Summarized Agenda / List</span>
          </button>
        </div>
      </div>

      {/* Category Legend & Conflict Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">Categories:</span>
          {Object.entries(CATEGORY_COLORS)
            .filter(([k]) => ['Tech', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Competition', 'General'].includes(k))
            .map(([cat, config]) => (
              <span key={cat} className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className={`w-3 h-3 rounded-full ${config.dot}`}></span>
                <span>{cat}</span>
              </span>
            ))}
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>Red = Schedule/Venue Conflict (Admin/Organizer Alert)</span>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading campus calendar events...</p>
        </div>
      ) : activeViewMode === 'calendar' ? (
        /* Full Calendar View (react-big-calendar) */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 overflow-hidden">
          <style>{`
            .rbc-calendar { font-family: inherit; min-height: 680px; }
            .rbc-header { padding: 10px 4px; font-weight: 600; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; }
            .rbc-today { background-color: #f0fdf4; }
            .rbc-event { padding: 2px 5px; border-radius: 6px; }
            .rbc-toolbar button { font-size: 0.825rem; font-weight: 500; border-radius: 6px; border: 1px solid #cbd5e1; }
            .rbc-toolbar button.rbc-active { background-color: #2563eb; color: #ffffff; border-color: #2563eb; }
          `}</style>

          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={calendarDate}
            onNavigate={(newDate) => setCalendarDate(newDate)}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="month"
            eventPropGetter={eventPropGetter}
            components={{
              event: CustomEvent,
            }}
            onSelectEvent={(event) => setSelectedEventModal(event)}
            popup
          />
        </div>
      ) : (
        /* Summarized Agenda / List View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Summarized Agenda & Chronological Feed</h3>
            <span className="text-xs text-slate-500">{sortedAgendaEvents.length} events listed</span>
          </div>

          {sortedAgendaEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No events scheduled in the calendar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedAgendaEvents.map((item) => {
                const catConfig = getCategoryConfig(item.category);
                const hasRedConflict = isStaff && item.hasConflict;

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-6 transition hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      hasRedConflict ? 'bg-rose-50/40 border-l-4 border-l-rose-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Date Badge */}
                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border flex-shrink-0 text-center ${
                        hasRedConflict
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {format(item.start, 'MMM')}
                        </span>
                        <span className="text-xl font-extrabold leading-tight">
                          {format(item.start, 'dd')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {format(item.start, 'EEE')}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catConfig.badge}`}>
                            {item.category}
                          </span>

                          <span className="text-xs text-slate-500 font-medium">
                            {item.clubName}
                          </span>

                          {hasRedConflict && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                              <span>⚠️</span>
                              <span>SCHEDULE CONFLICT</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item.timeStr} {item.endTimeStr ? `– ${item.endTimeStr}` : ''}</span>
                          </span>

                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{item.venue}</span>
                          </span>
                        </div>

                        {/* Conflict Reasons Warning Accordion/Box for Admins & Organizers */}
                        {hasRedConflict && item.conflictReasons.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-900 text-xs space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Conflict Details:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-rose-800 pl-1">
                              {item.conflictReasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setSelectedEventModal(item)}
                        className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                      >
                        Quick Preview
                      </button>

                      <Link
                        to={`/events/${item.id}`}
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                      >
                        Details &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Event Preview Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryConfig(selectedEventModal.category).badge}`}>
                  {selectedEventModal.category}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {selectedEventModal.clubName}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {selectedEventModal.title}
              </h3>

              {isStaff && selectedEventModal.hasConflict && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <span className="text-base">⚠️</span>
                    <span>Administrative Conflict Notice</span>
                  </div>
                  <p className="text-rose-800">
                    This event is conflicting with another scheduled booking. Please adjust venue or time window:
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-medium pl-1 text-rose-900">
                    {selectedEventModal.conflictReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-slate-400 font-medium">Date</span>
                  <span className="font-semibold text-slate-800">
                    {format(selectedEventModal.start, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Time Window</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEventModal.timeStr} {selectedEventModal.endTimeStr ? `– ${selectedEventModal.endTimeStr}` : ''}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-400 font-medium">Venue</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEventModal.venue}
                  </span>
                </div>
              </div>

              {selectedEventModal.original?.description && (
                <p className="text-xs text-slate-600 line-clamp-3">
                  {selectedEventModal.original.description}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>
                <Link
                  to={`/events/${selectedEventModal.id}`}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  View Full Event Page &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
