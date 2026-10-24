import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
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

  const isTabActive = (tabName) => {
    return location.pathname === '/dashboard' && location.search.includes(`tab=${tabName}`);
  };

  const isDashboardHome =
    location.pathname === '/dashboard' &&
    (!location.search || (!location.search.includes('tab=create-event') && !location.search.includes('tab=manage-events')));

  const linkBaseClasses =
    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all';
  const activeClasses = 'bg-blue-600 text-white shadow-sm';
  const inactiveClasses = 'text-slate-300 hover:bg-slate-800 hover:text-white';

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow">
            B
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">BAUST Events</span>
            <span className="text-[10px] text-slate-400 block -mt-1">Event Portal</span>
          </div>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`${linkBaseClasses} ${isDashboardHome ? activeClasses : inactiveClasses}`}
          onClick={onClose}
        >
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </Link>

        {/* Organizer Section: Create Event & Manage Events */}
        {isOrganizer && (
          <>
            <Link
              to="/dashboard?tab=manage-events"
              className={`${linkBaseClasses} ${isTabActive('manage-events') ? activeClasses : inactiveClasses}`}
              onClick={onClose}
            >
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Manage Events</span>
            </Link>

            <Link
              to="/dashboard?tab=create-event"
              className={`${linkBaseClasses} ${isTabActive('create-event') ? activeClasses : inactiveClasses}`}
              onClick={onClose}
            >
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Event</span>
            </Link>
          </>
        )}

        {/* Events Catalog */}
        <NavLink
          to="/events"
          className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          onClick={onClose}
        >
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>All Events</span>
        </NavLink>

        {/* Finances - Admin & Organizer only */}
        {hasFinanceAccess && (
          <NavLink
            to="/finances"
            className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            onClick={onClose}
          >
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Finances</span>
          </NavLink>
        )}

        {/* Users - Admin only */}
        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            onClick={onClose}
          >
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </NavLink>
        )}

        <div className="pt-4 pb-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Settings
          </div>
        </div>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          onClick={onClose}
        >
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Profile</span>
        </NavLink>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Logged In'}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition"
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
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:z-20">
        {navContent}
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
      >
        {navContent}
      </div>
    </>
  );
}
