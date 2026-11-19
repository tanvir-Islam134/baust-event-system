import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Sidebar({
  isOpen,
  onClose,
  onToggle,
  width = 256,
  onStartResize,
  isResizing = false,
  isDesktop = true,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (onClose) onClose();
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';
  const hasFinanceAccess = isAdmin || isOrganizer;
  const canManageEvents = isOrganizer || isAdmin;

  const isTabActive = (tabName) => {
    return location.pathname === '/dashboard' && location.search.includes(`tab=${tabName}`);
  };

  const isDashboardHome =
    location.pathname === '/dashboard' &&
    (!location.search ||
      (!location.search.includes('tab=create-event') &&
        !location.search.includes('tab=manage-events') &&
        !location.search.includes('tab=review-queue') &&
        !location.search.includes('tab=pending-registrations')));

  const linkBaseClasses =
    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all';
  const activeClasses = 'bg-[#FCA311] text-[#14213D] font-bold shadow-md shadow-[#FCA311]/25';
  const inactiveClasses = 'text-slate-300 hover:bg-[#1e2f52] hover:text-[#FCA311]';

  const navContent = (
    <div className="flex flex-col h-full bg-[#14213D] text-white w-full border-r border-[#1e2f52] select-none overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-5 border-b border-[#1e2f52] flex-shrink-0 bg-[#0d1629]">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition min-w-0">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm ring-2 ring-[#FCA311]/40 flex-shrink-0 overflow-hidden">
            <img
              src="/baust-logo.png"
              alt="BAUST Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0 truncate">
            <span className="font-bold text-sm tracking-tight text-white block truncate">BAUST Events</span>
            <span className="text-[10px] text-[#FCA311] font-medium block -mt-1 truncate">Event Portal</span>
          </div>
        </Link>

        {/* 3-Dot Toggle button inside header */}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-300 hover:text-[#FCA311] hover:bg-[#1e2f52] transition flex items-center justify-center flex-shrink-0 cursor-pointer"
          title="Toggle Menu Bar"
          aria-label="Toggle Menu Bar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-5 space-y-1.5">
        <div className="text-[11px] font-bold text-[#FCA311]/90 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`${linkBaseClasses} ${isDashboardHome ? activeClasses : inactiveClasses}`}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="truncate">Dashboard</span>
        </Link>

        {/* Event Management Section: Create Event & Manage Events (Organizer & Admin) */}
        {canManageEvents && (
          <>
            <Link
              to="/dashboard?tab=manage-events"
              className={`${linkBaseClasses} ${isTabActive('manage-events') ? activeClasses : inactiveClasses}`}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="truncate">Manage Events</span>
            </Link>

            <Link
              to="/dashboard?tab=create-event"
              className={`${linkBaseClasses} ${isTabActive('create-event') ? activeClasses : inactiveClasses}`}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="truncate">Create Event</span>
            </Link>
          </>
        )}

        {/* Events Catalog */}
        <NavLink
          to="/events"
          className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="truncate">All Events</span>
        </NavLink>

        {/* Event Calendar */}
        <NavLink
          to="/calendar"
          className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">Calendar View</span>
        </NavLink>

        {/* Finances - Admin & Organizer only */}
        {hasFinanceAccess && (
          <NavLink
            to="/finances"
            className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Finances</span>
          </NavLink>
        )}

        {/* Users - Admin only */}
        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="truncate">Users</span>
          </NavLink>
        )}

        <div className="pt-4 pb-2">
          <div className="text-[11px] font-bold text-[#FCA311]/90 uppercase tracking-wider px-3 mb-2">
            Settings
          </div>
        </div>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <svg className="w-5 h-5 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">Profile</span>
        </NavLink>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 sm:p-4 border-t border-[#1e2f52] bg-[#0d1629] flex-shrink-0">
        {user ? (
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 pr-2 hover:opacity-90 transition group flex-1 cursor-pointer"
              title="View your profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#1e2f52] text-[#FCA311] border border-[#FCA311]/40 group-hover:bg-[#FCA311] group-hover:text-[#14213D] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 transition shadow-inner">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-semibold text-white group-hover:text-[#FCA311] transition truncate">{user?.name || 'Logged In'}</p>
                <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role || 'User'}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#1e2f52] rounded-md transition flex-shrink-0 cursor-pointer"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] font-bold rounded-lg text-xs shadow-sm transition"
          >
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar with Drag Resizing */}
      <aside
        className={`hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:z-40 ${
          isResizing ? '' : 'transition-transform duration-200 ease-in-out'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: `${width}px` }}
      >
        <div className="relative w-full h-full flex">
          {navContent}

          {/* Draggable Splitter on Right Border (Desktop) */}
          <div
            onMouseDown={onStartResize}
            className={`absolute top-0 -right-1 bottom-0 w-3 cursor-col-resize z-30 group flex items-center justify-center transition-colors ${
              isResizing ? 'bg-[#FCA311]' : 'hover:bg-[#FCA311]/40'
            }`}
            title="Click and drag to resize menu bar width"
          >
            <div
              className={`w-[3px] h-8 rounded-full transition-colors ${
                isResizing ? 'bg-[#14213D]' : 'bg-[#1e2f52] group-hover:bg-[#FCA311]'
              }`}
            />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden shadow-2xl`}
        style={{ width: `${Math.min(width, 320)}px`, maxWidth: '85vw' }}
      >
        {navContent}
      </div>
    </>
  );
}
