import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AdminNotificationBell from '../admin/AdminNotificationBell.jsx';

export default function Navbar({ onToggleSidebar, isSidebarOpen = true }) {
  const { user, switchRole, logout, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const roleMenuRef = useRef(null);

  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInRole, setSignInRole] = useState(null);
  const signInMenuRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setIsRoleMenuOpen(false);
      }
      if (signInMenuRef.current && !signInMenuRef.current.contains(event.target)) {
        setSignInMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (newRole) => {
    if (newRole === user?.role) {
      setIsRoleMenuOpen(false);
      return;
    }
    try {
      setSwitchingRole(true);
      const existingClub = user?.roleProfiles?.organizer?.clubAffiliation || user?.clubAffiliation || null;
      await switchRole(newRole, existingClub);
      setIsRoleMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleDirectSignIn = async (role) => {
    try {
      setSignInLoading(true);
      setSignInRole(role);
      await loginWithGoogle(role, null);
      setSignInMenuOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Direct sign-in failed:', err);
    } finally {
      setSignInLoading(false);
      setSignInRole(null);
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
            {/* Quick Role Switcher for Testing / Evaluation */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition bg-amber-50 hover:bg-amber-100/90 text-[#14213D] border-[#FCA311]/70 shadow-2xs cursor-pointer"
                title="Switch role for supervisor evaluation (Student / Club Admin / HR Office)"
              >
                <span className="text-[11px]">🔄</span>
                <span className="font-extrabold text-[11px] text-[#14213D] hidden md:inline">Role:</span>
                <span className="capitalize text-[11px] font-bold text-amber-900">
                  {getRoleLabel(user.role)}
                </span>
                <svg className="w-3 h-3 text-slate-500 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Switch Active Role
                    </p>
                    <p className="text-xs text-slate-700 font-semibold truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    {/* Option 1: Participant */}
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('participant')}
                      disabled={switchingRole}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                        user.role === 'participant' ? 'bg-amber-50/70 text-[#14213D] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🎓</span>
                        <div className="text-left">
                          <div className="font-bold">Participant</div>
                          <div className="text-[10px] text-slate-400">Join events & browse clubs</div>
                        </div>
                      </div>
                      {user.role === 'participant' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                      )}
                    </button>

                    {/* Option 2: Organizer */}
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('organizer')}
                      disabled={switchingRole}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                        user.role === 'organizer' ? 'bg-amber-50/70 text-[#14213D] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🛡️</span>
                        <div className="text-left">
                          <div className="font-bold">Organizer</div>
                          <div className="text-[10px] text-slate-400">Manage club, create events</div>
                        </div>
                      </div>
                      {user.role === 'organizer' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                      )}
                    </button>

                    {/* Option 3: Admin */}
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('admin')}
                      disabled={switchingRole}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                        user.role === 'admin' ? 'bg-amber-50/70 text-[#14213D] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🏛️</span>
                        <div className="text-left">
                          <div className="font-bold">Admin</div>
                          <div className="text-[10px] text-slate-400">Oversee clubs & approvals</div>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                      )}
                    </button>
                  </div>

                  {switchingRole && (
                    <div className="px-3 py-2 text-center text-xs text-amber-700 bg-amber-50 border-t border-amber-100 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold">Switching role...</span>
                    </div>
                  )}
                </div>
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
          <div className="relative" ref={signInMenuRef}>
            <button
              type="button"
              onClick={() => setSignInMenuOpen(!signInMenuOpen)}
              className="px-3.5 py-1.5 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sign In with Google</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${
                  signInMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {signInMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0d162a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#FCA311]/50 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                  <p className="text-[10px] font-black text-[#FCA311] uppercase tracking-wider">
                    Sign in as
                  </p>
                  <p className="text-[10px] text-slate-300">Select active role to sign in</p>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleDirectSignIn('participant')}
                    disabled={signInLoading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                  >
                    <span className="text-base">🎓</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Participant</span>
                        {signInLoading && signInRole === 'participant' && (
                          <span className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Join events & browse clubs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectSignIn('organizer')}
                    disabled={signInLoading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                  >
                    <span className="text-base">🛡️</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Organizer</span>
                        {signInLoading && signInRole === 'organizer' && (
                          <span className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Manage club, create events</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectSignIn('admin')}
                    disabled={signInLoading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                  >
                    <span className="text-base">🏛️</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Admin</span>
                        {signInLoading && signInRole === 'admin' && (
                          <span className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">University administration</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
