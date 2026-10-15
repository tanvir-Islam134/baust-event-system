import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'organizer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu on Mobile */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-800">
            Bangladesh Army University of Science and Technology
          </h2>
          <p className="text-xs text-slate-500">Event Management & Ticketing System</p>
        </div>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-semibold text-slate-800">{user.name}</span>
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>

            <button
              onClick={logout}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50 transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            Sign In with Google
          </Link>
        )}
      </div>
    </header>
  );
}
