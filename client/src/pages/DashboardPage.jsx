import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-100 mb-3 border border-white/20">
            <span>BAUST Event System</span>
            <span>•</span>
            <span className="capitalize">{user?.role} Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Stay updated with all campus conferences, academic competitions, cultural fests, and sports tournaments.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/events"
              className="px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg text-sm hover:bg-blue-50 transition shadow-sm"
            >
              Browse Events
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-blue-600/60 hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition border border-white/20"
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl" />
        <div className="absolute right-32 top-0 w-32 h-32 bg-blue-500/20 rounded-full pointer-events-none blur-xl" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Events</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">4 Active</h3>
            <p className="text-xs text-slate-500 mt-1">Upcoming campus events</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/events" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>View calendar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Registrations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registrations</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">1 Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">Confirmed passes</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/events" className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              <span>Check tickets & QR</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Role & Access */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Level</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 capitalize">{user?.role || 'User'}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Organizer: <span className="capitalize">{user?.organizerStatus || 'None'}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/profile" className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1">
              <span>Manage privileges</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 4: Cohort Info or Financials */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isAdmin || isOrganizer ? 'Finances' : 'Cohort'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">
              {isAdmin || isOrganizer
                ? 'Overview'
                : user?.batch
                ? `${user.batch}`
                : 'Not Set'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin || isOrganizer
                ? 'Event ledgers & funds'
                : `Level ${user?.level || '-'}, Term ${user?.term || '-'}`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to={isAdmin || isOrganizer ? '/finances' : '/profile'}
              className="text-xs font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <span>{isAdmin || isOrganizer ? 'Open finance portal' : 'Update cohort'}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Campus Highlights */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Campus Event Highlights</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upcoming flagships scheduled at BAUST</p>
          </div>
          <Link to="/events" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Events &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-800 mb-2">
              Technology
            </span>
            <h4 className="text-sm font-bold text-slate-800">BAUST CSE Fest 2026</h4>
            <p className="text-xs text-slate-500 mt-1">
              Hackathon, competitive programming, project display, and gaming tournaments.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Nov 20, 2026</span>
              <span>•</span>
              <span>Central Auditorium</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 mb-2">
              Sports
            </span>
            <h4 className="text-sm font-bold text-slate-800">Inter-Department Cricket Tournament</h4>
            <p className="text-xs text-slate-500 mt-1">
              Annual championship clash between engineering and business faculties.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Dec 05, 2026</span>
              <span>•</span>
              <span>Main Campus Ground</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-800 mb-2">
              Cultural
            </span>
            <h4 className="text-sm font-bold text-slate-800">BAUST Cultural Gala Night</h4>
            <p className="text-xs text-slate-500 mt-1">
              Music, drama, arts exhibition, and award ceremony honoring student achievements.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Dec 18, 2026</span>
              <span>•</span>
              <span>Open Air Stage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
