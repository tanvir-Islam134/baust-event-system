import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AdminNotificationBell from '../admin/AdminNotificationBell.jsx';
import { isParticipantProfileComplete } from '../../utils/userUtils.js';

export default function Navbar({ onToggleSidebar, isSidebarOpen = true }) {
  const { user, logout, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [signInLoading, setSignInLoading] = useState(false);

  const handleDirectSignIn = async () => {
    try {
      setSignInLoading(true);
      const res = await loginWithGoogle();
      const loggedUser = res?.user || user;
      if (loggedUser?.role === 'participant' && !isParticipantProfileComplete(loggedUser)) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Direct sign-in failed:', err);
    } finally {
      setSignInLoading(false);
    }
  };

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

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'organizer') return 'Organizer';
    return 'Participant';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5E5E5] bg-white px-4 shadow-xs sm:px-6">
      <div className="flex items-center gap-3">
        {/* 3-Dot Toggle Button (Visible on both desktop & mobile) */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-[#E5E5E5]/60 hover:text-[#14213D] focus:outline-none transition flex items-center justify-center flex-shrink-0 cursor-pointer"
          title={isSidebarOpen ? 'Collapse Menu Bar' : 'Open Menu Bar'}
          aria-label="Toggle Menu Bar"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition">
          <div
            className={`w-8 h-8 rounded-full bg-white border border-[#E5E5E5] p-0.5 ${
              isSidebarOpen ? 'flex md:hidden' : 'flex'
            } items-center justify-center flex-shrink-0 shadow-xs ring-1 ring-[#FCA311]/30 overflow-hidden`}
          >
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
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Authentic Assigned Role Display Badge (Non-interactive) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${getRoleBadgeColor(
                user.role
              )}`}
              title={`Logged in as ${getRoleLabel(user.role)}${user.clubAffiliation && user.role === 'organizer' ? ` (${user.clubAffiliation})` : ''}`}
            >
              <span className="text-xs">
                {user.role === 'admin' ? '🏛️' : user.role === 'organizer' ? '🛡️' : '🎓'}
              </span>
              <span className="capitalize">{getRoleLabel(user.role)}</span>
              {user.role === 'organizer' && user.clubAffiliation && (
                <span className="text-[10px] opacity-80 hidden lg:inline truncate max-w-[130px]">
                  • {user.clubAffiliation}
                </span>
              )}
            </div>

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

              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] group-hover:ring-2 group-hover:ring-[#FCA311]/50 ring-1 ring-[#FCA311]/30 flex items-center justify-center font-bold text-xs uppercase shadow-inner transition flex-shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : user.name ? (
                  user.name.charAt(0)
                ) : (
                  'U'
                )}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-50 transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleDirectSignIn}
              disabled={signInLoading}
              className="px-3.5 py-1.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {signInLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Sign In with Google</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
