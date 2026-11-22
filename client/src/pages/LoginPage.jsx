import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { BAUST_CLUBS } from './RegisterPage.jsx';

/**
 * Role Selection Options:
 * 1. Participant: Browse events, register, and get digital QR passes
 * 2. Organizer: Manage club, publish events, gate scanner, and finances
 * 3. Admin: University admin, oversee clubs, and approve organizers
 */
const ROLE_OPTIONS = [
  {
    id: 'participant',
    title: 'Participant',
    description: 'Join clubs, browse campus events, and manage passes',
    icon: (
      <svg className="w-6 h-6 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
      </svg>
    ),
  },
  {
    id: 'organizer',
    title: 'Organizer',
    description: 'Manage club, publish events, gate scanner, and finances',
    icon: (
      <svg className="w-6 h-6 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 4a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm4 9.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5 0-1.66 2.34-2.5 4-2.5s4 .84 4 2.5z" />
      </svg>
    ),
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Oversee clubs, approve organizers, and site governance',
    icon: (
      <svg className="w-6 h-6 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, switchRole, logout, isAuthenticated, user } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';
  const [selectedRole, setSelectedRole] = useState('participant');
  const [selectedClub, setSelectedClub] = useState('CSE Society of BAUST');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // If already authenticated, display status & quick navigation / instant role switch
  if (isAuthenticated && user) {
    const handleQuickSwitch = async (role) => {
      try {
        setLoading(true);
        setErrorMsg(null);
        await switchRole(role, selectedClub);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to switch role');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Signed In Successfully</h2>
          <p className="text-sm text-slate-500 mb-4">
            Account: <span className="font-semibold text-slate-800">{user.email}</span>
            <br />
            Active Role: <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14213D] text-[#FCA311] capitalize">{user.role}</span>
            {user.clubAffiliation && user.role === 'organizer' && (
              <span className="block text-xs text-slate-600 mt-1 font-medium">({user.clubAffiliation})</span>
            )}
          </p>

          {/* Quick Role Switcher */}
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>🔄 Select Role for Platform:</span>
              {loading && <span className="text-[11px] text-amber-600 font-medium">Updating...</span>}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwitch('participant')}
                disabled={loading}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                  user.role === 'participant'
                    ? 'bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                🎓 Participant
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('organizer')}
                disabled={loading}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                  user.role === 'organizer'
                    ? 'bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                🛡️ Organizer
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin')}
                disabled={loading}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center cursor-pointer ${
                  user.role === 'admin'
                    ? 'bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                🏛️ Admin
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(from, { replace: true })}
              className="w-full py-2.5 px-4 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-md shadow-[#FCA311]/20 transition cursor-pointer"
            >
              Continue to {from === '/dashboard' ? 'Dashboard' : 'Page'} &rarr;
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginWithGoogle(selectedRole, selectedRole === 'organizer' ? selectedClub : null);
      navigate(from, { replace: true });
    } catch (err) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
      let message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Google Authentication failed';

      if (err?.code === 'auth/unauthorized-domain' || (typeof message === 'string' && message.includes('unauthorized-domain'))) {
        message = `Firebase Unauthorized Domain: The current domain (${window.location.hostname}) must be added to your Firebase Console > Authentication > Settings > Authorized domains.`;
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (r) => {
    if (r === 'admin') return 'Admin';
    if (r === 'organizer') return 'Organizer';
    return 'Participant';
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-200 p-1.5 mx-auto mb-3 flex items-center justify-center">
            <img
              src="/baust-logo.png"
              alt="BAUST University Crest"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <span className="inline-block py-1 px-3 rounded-full text-[11px] font-bold bg-[#14213D] text-[#FCA311] uppercase tracking-wider mb-2">
            BAUST Event System
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Select Your Role</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose how you want to access the platform
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* 3 Role Selection Cards: Participant, Organizer, Admin */}
        <div className="space-y-3 mb-5">
          {ROLE_OPTIONS.map((opt) => {
            const isSelected = selectedRole === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => setSelectedRole(opt.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl transition flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'border-[#14213D] bg-slate-50/70 shadow-xs ring-2 ring-[#14213D]/15'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                      isSelected ? 'bg-slate-200/80' : 'bg-slate-100'
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? 'border-[#14213D] bg-[#14213D] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Club Selector when Organizer is selected */}
        {selectedRole === 'organizer' && (
          <div className="mb-5 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-left">
            <label className="block text-xs font-bold text-amber-950 mb-1.5 flex items-center gap-1.5">
              <span>🏛️</span> Assigned Club for Organizer:
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
            >
              {BAUST_CLUBS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-amber-800/80 mt-1.5 font-medium">
              Verified organizer permissions will be automatically assigned for seamless evaluation.
            </p>
          </div>
        )}

        {/* Google Sign In Action Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition font-bold text-slate-700 text-sm shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          <span>
            {loading ? 'Signing in...' : `Sign In with Google as ${getRoleDisplayName(selectedRole)}`}
          </span>
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          <Link to="/" className="text-slate-400 hover:text-slate-600 transition">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
