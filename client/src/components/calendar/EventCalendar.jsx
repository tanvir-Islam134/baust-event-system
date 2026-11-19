import React, { useState, useMemo, useRef, useEffect } from 'react';
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
 * Modern, vibrant category color palette
 * - Tech in vibrant blue
 * - Cultural in vibrant purple
 * - Sports in vibrant green
 * - Seminars in vibrant orange
 * - Workshop in vibrant teal
 * - Competition in vibrant rose
 * - General in vibrant indigo
 */
export const CATEGORY_PALETTES = {
  Tech: {
    name: 'Tech',
    borderLeft: 'border-l-blue-600',
    bg: 'bg-blue-50/90 hover:bg-blue-100/90',
    borderRest: 'border-blue-200/80',
    text: 'text-blue-950',
    subtext: 'text-blue-700',
    dot: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    hex: '#2563eb',
    solidBorder: '#2563eb',
    tintBg: 'rgba(239, 246, 255, 0.95)',
  },
  Technology: {
    name: 'Tech',
    borderLeft: 'border-l-blue-600',
    bg: 'bg-blue-50/90 hover:bg-blue-100/90',
    borderRest: 'border-blue-200/80',
    text: 'text-blue-950',
    subtext: 'text-blue-700',
    dot: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    hex: '#2563eb',
    solidBorder: '#2563eb',
    tintBg: 'rgba(239, 246, 255, 0.95)',
  },
  Hackathon: {
    name: 'Hackathon',
    borderLeft: 'border-l-blue-600',
    bg: 'bg-blue-50/90 hover:bg-blue-100/90',
    borderRest: 'border-blue-200/80',
    text: 'text-blue-950',
    subtext: 'text-blue-700',
    dot: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    hex: '#2563eb',
    solidBorder: '#2563eb',
    tintBg: 'rgba(239, 246, 255, 0.95)',
  },
  Cultural: {
    name: 'Cultural',
    borderLeft: 'border-l-purple-600',
    bg: 'bg-purple-50/90 hover:bg-purple-100/90',
    borderRest: 'border-purple-200/80',
    text: 'text-purple-950',
    subtext: 'text-purple-700',
    dot: 'bg-purple-600',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    hex: '#9333ea',
    solidBorder: '#9333ea',
    tintBg: 'rgba(250, 245, 255, 0.95)',
  },
  Sports: {
    name: 'Sports',
    borderLeft: 'border-l-emerald-600',
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
    borderRest: 'border-emerald-200/80',
    text: 'text-emerald-950',
    subtext: 'text-emerald-700',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    hex: '#16a34a',
    solidBorder: '#16a34a',
    tintBg: 'rgba(236, 253, 245, 0.95)',
  },
  Seminar: {
    name: 'Seminar',
    borderLeft: 'border-l-amber-600',
    bg: 'bg-amber-50/90 hover:bg-amber-100/90',
    borderRest: 'border-amber-200/80',
    text: 'text-amber-950',
    subtext: 'text-amber-700',
    dot: 'bg-amber-600',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    hex: '#ea580c',
    solidBorder: '#ea580c',
    tintBg: 'rgba(255, 251, 235, 0.95)',
  },
  Workshop: {
    name: 'Workshop',
    borderLeft: 'border-l-teal-600',
    bg: 'bg-teal-50/90 hover:bg-teal-100/90',
    borderRest: 'border-teal-200/80',
    text: 'text-teal-950',
    subtext: 'text-teal-700',
    dot: 'bg-teal-600',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    hex: '#0d9488',
    solidBorder: '#0d9488',
    tintBg: 'rgba(240, 253, 250, 0.95)',
  },
  Competition: {
    name: 'Competition',
    borderLeft: 'border-l-rose-500',
    bg: 'bg-rose-50/90 hover:bg-rose-100/90',
    borderRest: 'border-rose-200/80',
    text: 'text-rose-950',
    subtext: 'text-rose-700',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    hex: '#f43f5e',
    solidBorder: '#f43f5e',
    tintBg: 'rgba(255, 241, 242, 0.95)',
  },
  General: {
    name: 'General',
    borderLeft: 'border-l-indigo-600',
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
    borderRest: 'border-indigo-200/80',
    text: 'text-indigo-950',
    subtext: 'text-indigo-700',
    dot: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    hex: '#4f46e5',
    solidBorder: '#4f46e5',
    tintBg: 'rgba(238, 242, 255, 0.95)',
  },
};

export const getCategoryPalette = (category) => {
  const norm = (category || 'General').trim();
  const matchedKey = Object.keys(CATEGORY_PALETTES).find(
    (k) => k.toLowerCase() === norm.toLowerCase()
  );
  return matchedKey ? CATEGORY_PALETTES[matchedKey] : CATEGORY_PALETTES.General;
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

  // Active view state
  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Interactive Popover / Tooltip state
  const [popoverState, setPopoverState] = useState(null); // { event, x, y }
  const popoverTimerRef = useRef(null);

  // Full Details Modal state
  const [selectedEventModal, setSelectedEventModal] = useState(null);

  // Transform events for BigCalendar
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

      const now = new Date();
      // Past event check based on date/time
      const isPast = end < now || start < now;

      return {
        id: ev.id,
        title: ev.title || ev.eventName || 'Untitled Event',
        start,
        end,
        isPast,
        category: ev.category || 'General',
        venue: ev.venue || 'Campus Venue TBA',
        timeStr: ev.time || ev.startTime || '10:00 AM',
        endTimeStr: ev.endTime || '',
        clubName: ev.clubName || ev.clubAffiliation || 'BAUST Club',
        description: ev.description || '',
        hasConflict: Boolean(ev.hasConflict),
        conflictReasons: ev.conflictReasons || [],
        conflictingWith: ev.conflictingWith || [],
        original: ev,
      };
    });
  }, [events]);

  // Clean popover timer on unmount
  useEffect(() => {
    return () => {
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    };
  }, []);

  const handleEventMouseEnter = (e, event) => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();

    // Position popover intelligently relative to viewport
    const popoverWidth = 320;
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    if (x + popoverWidth > window.innerWidth - 16) {
      x = window.innerWidth - popoverWidth - 16;
    }
    if (x < 16) x = 16;

    let y = rect.bottom + 8;
    // If popover would overflow bottom of viewport, position above
    if (y + 240 > window.innerHeight) {
      y = Math.max(16, rect.top - 230);
    }

    setPopoverState({
      event,
      x,
      y,
    });
  };

  const handleEventMouseLeave = () => {
    popoverTimerRef.current = setTimeout(() => {
      setPopoverState(null);
    }, 120);
  };

  const handlePopoverMouseEnter = () => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
  };

  const handlePopoverMouseLeave = () => {
    setPopoverState(null);
  };

  // Custom Event block in BigCalendar
  const CustomEventBlock = ({ event }) => {
    const hasRedConflict = isStaff && event.hasConflict;
    const palette = getCategoryPalette(event.category);
    const isPast = event.isPast;

    return (
      <div
        onMouseEnter={(e) => handleEventMouseEnter(e, event)}
        onMouseLeave={handleEventMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          setPopoverState(null);
          setSelectedEventModal(event);
        }}
        className={`group relative w-full px-2 py-1 my-0.5 rounded-md border-l-[3.5px] border-t border-r border-b text-left cursor-pointer transition-all duration-150 ease-out hover:scale-105 hover:z-30 hover:shadow-md select-none ${
          isPast ? 'opacity-65 hover:opacity-95' : ''
        } ${
          hasRedConflict
            ? 'bg-rose-100/90 hover:bg-rose-200/90 border-l-rose-600 border-rose-300 text-rose-950 font-semibold'
            : isPast
            ? 'bg-slate-100/90 hover:bg-slate-200/90 border-l-slate-400 border-slate-300 text-slate-600'
            : `${palette.bg} ${palette.borderLeft} ${palette.borderRest} ${palette.text}`
        }`}
      >
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                hasRedConflict
                  ? 'bg-rose-600 animate-ping'
                  : isPast
                  ? 'bg-slate-400'
                  : palette.dot
              }`}
            />
            <span
              className={`font-bold text-[11px] truncate leading-tight ${
                isPast ? 'text-slate-600' : ''
              }`}
            >
              {event.title}
            </span>
          </div>

          {hasRedConflict ? (
            <span className="flex-shrink-0 text-[8.5px] font-black px-1 py-0.2 rounded bg-rose-600 text-white shadow-2xs">
              CONFLICT
            </span>
          ) : isPast ? (
            <span className="flex-shrink-0 text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs">
              Done
            </span>
          ) : (
            <span
              className={`text-[9.5px] font-semibold opacity-80 hidden sm:inline flex-shrink-0 ${palette.subtext}`}
            >
              {event.timeStr ? event.timeStr.replace(/\s*[AP]M/i, '') : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Custom RBC Toolbar
  const CustomToolbar = (toolbar) => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-gray-200/90">
        {/* Navigation buttons: Today, Back, Next */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toolbar.onNavigate('TODAY')}
            className="px-4 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#14213D] hover:border-[#FCA311] transition-all duration-150 shadow-xs active:scale-95"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toolbar.onNavigate('PREV')}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#14213D] hover:border-[#FCA311] transition-all duration-150 shadow-xs active:scale-95"
              aria-label="Previous Period"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => toolbar.onNavigate('NEXT')}
              className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#14213D] hover:border-[#FCA311] transition-all duration-150 shadow-xs active:scale-95"
              aria-label="Next Period"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium pl-1 hidden sm:inline">
            {format(toolbar.date, 'EEEE')}
          </span>
        </div>

        {/* Current Period Label */}
        <div className="text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {toolbar.label}
          </h2>
        </div>

        {/* View Switcher: Month, Week, Agenda */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-full border border-gray-200 self-start md:self-auto shadow-inner">
          {[
            { id: 'month', label: 'Month' },
            { id: 'week', label: 'Week' },
            { id: 'agenda', label: 'Agenda' },
          ].map((v) => {
            const isActive = toolbar.view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  toolbar.onView(v.id);
                  setCurrentView(v.id);
                }}
                className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#14213D] text-[#FCA311] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#14213D] hover:bg-white font-medium'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const totalConflicts = useMemo(() => {
    return calendarEvents.filter((e) => e.hasConflict).length;
  }, [calendarEvents]);

  return (
    <div className="space-y-6">
      {/* Category Color Legend Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">Event Categories:</span>
          {[
            { label: 'Tech', key: 'Tech' },
            { label: 'Cultural', key: 'Cultural' },
            { label: 'Sports', key: 'Sports' },
            { label: 'Seminars', key: 'Seminar' },
            { label: 'Workshops', key: 'Workshop' },
            { label: 'Competitions', key: 'Competition' },
            { label: 'General', key: 'General' },
          ].map(({ label, key }) => {
            const p = getCategoryPalette(key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 font-medium text-slate-700 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                <span>{label}</span>
              </span>
            );
          })}
        </div>

        {isStaff && totalConflicts > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>{totalConflicts} Schedule Conflict{totalConflicts > 1 ? 's' : ''} (Red Pills)</span>
          </div>
        )}
      </div>

      {/* Main Modern Calendar Container */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-5 sm:p-7 relative transition-all overflow-hidden">
        {/* Scoped CSS overrides for react-big-calendar */}
        <style>{`
          /* Grid container & layout */
          .rbc-calendar {
            font-family: inherit;
            min-height: 720px;
          }
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            background-color: #ffffff;
          }
          
          /* Headers */
          .rbc-header {
            padding: 12px 6px;
            font-weight: 700;
            color: #475569;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
            border-color: #f1f5f9;
          }

          /* Soft cell grid lines */
          .rbc-day-bg + .rbc-day-bg,
          .rbc-month-row + .rbc-month-row,
          .rbc-time-header-content,
          .rbc-time-content > * + * > *,
          .rbc-day-slot .rbc-time-slot {
            border-color: #f1f5f9 !important;
          }

          /* Off-range day styling */
          .rbc-off-range-bg {
            background-color: #fafbfc;
          }
          .rbc-off-range .rbc-button-link {
            color: #94a3b8;
          }

          /* Highlight Current Day Cell */
          .rbc-today {
            background-color: rgba(239, 246, 255, 0.40) !important;
          }

          /* Modern bolder typography on date cells */
          .rbc-date-cell {
            padding: 8px 10px;
            font-weight: 700;
            font-size: 0.875rem;
            color: #1e293b;
          }
          
          /* Today date badge */
          .rbc-now.rbc-current .rbc-button-link,
          .rbc-today .rbc-button-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 9999px;
            background-color: #2563eb;
            color: #ffffff !important;
            font-weight: 800;
            box-shadow: 0 1px 3px rgba(37, 99, 235, 0.35);
          }

          /* Event block wrapper */
          .rbc-event {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 2px 4px !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .rbc-event:focus {
            outline: none !important;
          }

          /* Show more popup */
          .rbc-overlay {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 12px;
            background: #ffffff;
            z-index: 50;
          }
          .rbc-overlay-header {
            font-weight: 700;
            font-size: 0.85rem;
            color: #0f172a;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }

          /* Agenda View Modernization */
          .rbc-agenda-view table.rbc-agenda-table {
            border-collapse: separate;
            border-spacing: 0;
            border: none;
          }
          .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
            padding: 12px 14px;
            border-color: #f1f5f9;
            vertical-align: middle;
            font-size: 0.85rem;
          }
          .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
            padding: 12px 14px;
            border-color: #e2e8f0;
            background: #f8fafc;
            font-size: 0.75rem;
            font-weight: 700;
            color: #475569;
          }
          .rbc-agenda-date-cell {
            font-weight: 700;
            color: #0f172a;
          }
          .rbc-agenda-time-cell {
            color: #64748b;
            font-weight: 500;
          }
        `}</style>

        {loading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading campus schedule...</p>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={calendarDate}
            onNavigate={(newDate) => setCalendarDate(newDate)}
            view={currentView}
            onView={(newView) => setCurrentView(newView)}
            views={['month', 'week', 'agenda']}
            components={{
              toolbar: CustomToolbar,
              event: CustomEventBlock,
            }}
            onSelectEvent={(event) => {
              setPopoverState(null);
              setSelectedEventModal(event);
            }}
            popup
          />
        )}

        {/* Interactive Floating Hover Popover / Tooltip */}
        {popoverState && (
          <div
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            style={{
              position: 'fixed',
              top: `${popoverState.y}px`,
              left: `${popoverState.x}px`,
              width: '320px',
              zIndex: 9999,
            }}
            className="animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          >
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 p-4 text-xs space-y-2.5 backdrop-blur-md">
              {/* Popover Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      getCategoryPalette(popoverState.event.category).badge
                    }`}
                  >
                    {popoverState.event.category}
                  </span>
                  {popoverState.event.isPast && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                      Done
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-medium text-slate-500 truncate max-w-[170px]">
                  {popoverState.event.clubName}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                {popoverState.event.title}
              </h4>

              {/* Schedule Overlap / Conflict Alert for Staff */}
              {isStaff && popoverState.event.hasConflict && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-rose-700">
                    <span>⚠️</span>
                    <span>Conflict Alert</span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-tight">
                    {popoverState.event.conflictReasons[0] || 'Overlaps with another venue booking'}
                  </p>
                </div>
              )}

              {/* Timing & Venue */}
              <div className="space-y-1.5 pt-0.5 text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {format(popoverState.event.start, 'MMM d, yyyy')} &bull; {popoverState.event.timeStr}{' '}
                    {popoverState.event.endTimeStr ? `– ${popoverState.event.endTimeStr}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{popoverState.event.venue}</span>
                </div>
              </div>

              {/* Description Snippet */}
              {popoverState.event.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed pt-1 border-t border-slate-100">
                  {popoverState.event.description}
                </p>
              )}

              {/* Bottom Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium">Click pill to open details</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventModal(popoverState.event);
                    setPopoverState(null);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Event Details Modal on Click */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    getCategoryPalette(selectedEventModal.category).badge
                  }`}
                >
                  {selectedEventModal.category}
                </span>
                {selectedEventModal.isPast && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                    Done / Event Ended
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-500">
                  {selectedEventModal.clubName}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {selectedEventModal.title}
              </h3>

              {isStaff && selectedEventModal.hasConflict && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-2 shadow-xs">
                  <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                    <span className="text-base">⚠️</span>
                    <span>Administrative Conflict Alert</span>
                  </div>
                  <p className="text-rose-800 font-medium leading-relaxed">
                    This event is conflicting with another scheduled booking. Please adjust the venue or time slot:
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-semibold pl-1 text-rose-900">
                    {selectedEventModal.conflictReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="block text-slate-400 font-medium">Date</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {format(selectedEventModal.start, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Time Slot</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedEventModal.timeStr}{' '}
                    {selectedEventModal.endTimeStr ? `– ${selectedEventModal.endTimeStr}` : ''}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="block text-slate-400 font-medium">Venue Location</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                    <span>📍</span>
                    <span>{selectedEventModal.venue}</span>
                  </span>
                </div>
              </div>

              {selectedEventModal.original?.description && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Description & Details
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                    {selectedEventModal.original.description}
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <Link
                  to={`/events/${selectedEventModal.id}`}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] shadow-md shadow-[#FCA311]/20 transition"
                >
                  Open Full Event Page &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
