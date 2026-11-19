import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AdminNotificationBell from '../admin/AdminNotificationBell.jsx';

export default function Navbar({ onToggleSidebar, isSidebarOpen = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#14213D] text-[#FCA311] border-[#FCA311]/40 font-bold shadow-xs';
      case 'organizer':
        return 'bg-[#FCA311]/15 text-[#14213D] border-[#FCA311] font-bold';
      default:
        return 'bg-[#E5E5E5] text-[#14213D] border-[#E5E5E5] font-semibold';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5E5E5] bg-white px-4 shadow-xs sm:px-6">
      <div className="flex items-center gap-3">
        {/* 3-Dot Toggle Button (Visible on both desktop & mobile) */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-[#E5E5E5]/60 hover:text-[#14213D] focus:outline-none transition flex items-center justify-center flex-shrink-0"
          title={isSidebarOpen ? "Collapse Menu Bar" : "Open Menu Bar"}
          aria-label="Toggle Menu Bar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition">
          <div className={`w-8 h-8 rounded-full bg-white border border-[#E5E5E5] p-0.5 ${isSidebarOpen ? 'flex md:hidden' : 'flex'} items-center justify-center flex-shrink-0 shadow-xs ring-1 ring-[#FCA311]/30 overflow-hidden`}>
            <img
              src="/baust-logo.png"
              alt="BAUST Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#14213D] leading-tight">
              BAUST <span className="hidden sm:inline">Event System</span>
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Saidpur Cantonment</p>
          </div>
        </Link>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Real-time Admin Notifications */}
            {user.role === 'admin' && <AdminNotificationBell />}

            <Link
              to="/profile"
              className="flex items-center gap-2.5 hover:opacity-90 transition group p-1 -m-1 rounded-xl hover:bg-[#E5E5E5]/40 cursor-pointer"
              title="View your profile"
            >
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-[#14213D] group-hover:text-[#FCA311] transition">
                  {user.name}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] rounded-full border capitalize ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#14213D] text-[#FCA311] group-hover:bg-[#FCA311] group-hover:text-[#14213D] group-hover:ring-2 group-hover:ring-[#FCA311]/40 flex items-center justify-center font-bold text-xs uppercase shadow-inner transition">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50 transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3.5 py-1.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-lg text-xs font-bold transition shadow-sm"
          >
            Sign In with Google
          </Link>
        )}
      </div>
    </header>
  );
}
