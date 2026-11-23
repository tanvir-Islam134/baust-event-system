import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isParticipantProfileComplete } from '../utils/userUtils.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, logout, isAuthenticated, user } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';
  
  // Initialize portal based on query param (e.g., /login?portal=admin)
  const initialPortal = new URLSearchParams(location.search).get('portal') === 'admin' ? 'admin' : 'participant';
  const [selectedPortal, setSelectedPortal] = useState(initialPortal);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [adminEligibilityError, setAdminEligibilityError] = useState(null);

  // If already authenticated, display status & quick navigation
  if (isAuthenticated && user) {
    const getRoleBadge = (role) => {
      if (role === 'admin') {
        return { label: 'Admin', icon: '🏛️', color: 'bg-[#14213D] text-[#FCA311] border-[#FCA311]/40' };
      }
      if (role === 'organizer') {
        return { label: 'Organizer', icon: '🛡️', color: 'bg-[#FCA311]/20 text-[#FCA311] border-[#FCA311]' };
      }
      return { label: 'Participant', icon: '🎓', color: 'bg-white/10 text-slate-200 border-white/20' };
    };

    const roleInfo = getRoleBadge(user.role);

    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#070E1E] via-[#0B132B] to-[#14213D]">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FCA311]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-[#0d162a]/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 text-center text-white ring-1 ring-white/5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Signed In Successfully</h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-6">
            Account: <span className="font-semibold text-white">{user.email}</span>
            <br />
            Assigned Role:{' '}
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.color}`}>
              <span>{roleInfo.icon}</span>
              <span>{roleInfo.label}</span>
            </span>
            {user.clubAffiliation && user.role === 'organizer' && (
              <span className="block text-xs text-[#FCA311] mt-1.5 font-semibold">
                Affiliation: {user.clubAffiliation}
              </span>
            )}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (user.role === 'participant' && !isParticipantProfileComplete(user)) {
                  navigate('/onboarding', { replace: true });
                } else {
                  navigate(from, { replace: true });
                }
              }}
              className="w-full py-3 px-4 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-lg shadow-[#FCA311]/25 hover:shadow-[#FCA311]/40 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              Continue to {from === '/dashboard' ? 'Dashboard' : 'Page'} &rarr;
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async (portalToUse = selectedPortal) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setAdminEligibilityError(null);

      // Pass portal identifier to backend for strict eligibility check
      const res = await loginWithGoogle(portalToUse === 'admin' ? 'admin' : 'participant');
      const loggedUser = res?.user || user;
      
      if (loggedUser?.role === 'participant' && !isParticipantProfileComplete(loggedUser)) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }

      const status = err.response?.status;
      const errorData = err.response?.data?.error;
      const serverMessage = errorData?.message || err.response?.data?.message || err.message || '';
      const attemptedEmail = errorData?.details?.email || errorData?.details?.attemptedEmail || '';

      // Check if user was rejected because they are not eligible for admin
      if (
        status === 403 ||
        errorData?.details?.code === 'NOT_ELIGIBLE_FOR_ADMIN' ||
        serverMessage.toLowerCase().includes('not eligible for admin')
      ) {
        setAdminEligibilityError({
          message: 'You are not eligible for admin. Please sign in or sign up as a Participant.',
          attemptedEmail,
        });
        setErrorMsg(null);
        return;
      }

      let message = serverMessage || 'Google Authentication failed';
      if (err?.code === 'auth/unauthorized-domain' || (typeof message === 'string' && message.includes('unauthorized-domain'))) {
        message = `Firebase Unauthorized Domain: The current domain (${window.location.hostname}) must be added to your Firebase Console > Authentication > Settings > Authorized domains.`;
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToParticipantAndLogin = async () => {
    setSelectedPortal('participant');
    setAdminEligibilityError(null);
    setErrorMsg(null);
    await handleGoogleLogin('participant');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-[#070E1E] via-[#0B132B] to-[#14213D] py-12">
      {/* Background Ambient Glows & Grid Pattern */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[#FCA311]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative z-10 max-w-md w-full bg-[#0d162a]/85 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 ring-1 ring-white/5 text-center">
        
        {/* Header Branding */}
        <div className="mb-5">
          <div className="w-20 h-20 rounded-full bg-white p-1.5 mx-auto mb-3.5 flex items-center justify-center ring-4 ring-[#FCA311]/30 shadow-xl shadow-[#FCA311]/15">
            <img
              src="/baust-logo.png"
              alt="BAUST University Crest"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-[#FCA311]/40 text-[#FCA311] text-[11px] font-bold uppercase tracking-wider mb-2.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
            <span>BAUST Event System</span>
            <span className="text-white/40">•</span>
            <span className="text-white font-medium">Saidpur</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {selectedPortal === 'admin' ? 'Administration Portal' : 'Portal Sign In'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-normal">
            {selectedPortal === 'admin'
              ? 'Restricted to authorized university administration accounts'
              : 'Sign in with your Google or BAUST institutional account'}
          </p>
        </div>

        {/* Portal Switcher Tabs: Participant vs Admin */}
        <div className="flex p-1 bg-[#070E1E] rounded-2xl border border-white/10 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setSelectedPortal('participant');
              setErrorMsg(null);
              setAdminEligibilityError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedPortal === 'participant'
                ? 'bg-[#FCA311] text-[#14213D] shadow-md shadow-[#FCA311]/25 font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎓</span>
            <span>Participant / Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedPortal('admin');
              setErrorMsg(null);
              setAdminEligibilityError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedPortal === 'admin'
                ? 'bg-[#14213D] text-[#FCA311] border border-[#FCA311]/60 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏛️</span>
            <span>University Admin</span>
          </button>
        </div>

        {/* Dedicated Admin Eligibility Rejection Banner */}
        {adminEligibilityError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border-2 border-[#FCA311] text-left animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h4 className="text-sm font-black text-[#FCA311] uppercase tracking-wide">
                  You are not eligible for admin
                </h4>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Only selected institutional email addresses are authorized for Admin login.{' '}
                  {adminEligibilityError.attemptedEmail ? (
                    <span>
                      Account <span className="font-bold text-white">({adminEligibilityError.attemptedEmail})</span> is not eligible.
                    </span>
                  ) : (
                    'This Google account is not eligible for administrative privileges.'
                  )}
                </p>
                
                {/* Instant CTA to continue as Participant */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSwitchToParticipantAndLogin}
                    disabled={loading}
                    className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs font-black shadow-md shadow-[#FCA311]/25 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎓</span>
                    <span>Sign in / Sign up as Participant</span>
                    <span>&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPortal('participant');
                      setAdminEligibilityError(null);
                      setErrorMsg(null);
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Switch to Participant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {errorMsg && !adminEligibilityError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 backdrop-blur-md text-left">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Google Sign In Action Button */}
        <button
          onClick={() => handleGoogleLogin(selectedPortal)}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl transition transform hover:-translate-y-0.5 active:translate-y-0 font-black text-sm sm:text-base shadow-xl disabled:opacity-50 cursor-pointer mb-6 ${
            selectedPortal === 'admin'
              ? 'bg-[#14213D] hover:bg-black text-[#FCA311] border-2 border-[#FCA311] shadow-[#FCA311]/20'
              : 'bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] shadow-[#FCA311]/25 hover:shadow-[#FCA311]/40'
          }`}
        >
          {loading ? (
            <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
              selectedPortal === 'admin' ? 'border-[#FCA311]' : 'border-[#14213D]'
            }`} />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs p-1">
              <svg className="w-full h-full" viewBox="0 0 24 24">
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
            </div>
          )}
          <span>
            {loading
              ? 'Authenticating with Google...'
              : selectedPortal === 'admin'
              ? 'Sign In with Google as Admin'
              : 'Sign In with Google as Participant'}
          </span>
        </button>

        {/* Real-world Academic Governance Guidelines Card */}
        <div className="p-4 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 text-left space-y-2.5">
          <p className="text-[11px] font-black text-[#FCA311] uppercase tracking-wider flex items-center gap-1.5">
            <span>ℹ️</span> {selectedPortal === 'admin' ? 'Admin Access Rules:' : 'Participant & Club Roles:'}
          </p>
          {selectedPortal === 'admin' ? (
            <ul className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#FCA311] font-bold">🏛️</span>
                <span><strong>Designated Administrators Only:</strong> Fixed authorized university authority email is verified by the server.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">⚠️</span>
                <span><strong>Unauthorized Accounts:</strong> Attempting to log in as Admin with a personal or unauthorized student email will be blocked.</span>
              </li>
            </ul>
          ) : (
            <ul className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-300 font-bold">🎓</span>
                <span><strong>All BAUST Accounts:</strong> Any Google or BAUST email can sign in as a Participant to browse events and download digital QR passes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🛡️</span>
                <span><strong>Become a Club Organizer:</strong> Once signed in as a participant, submit an Organizer application with your club from your Profile.</span>
              </li>
            </ul>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <Link to="/" className="text-slate-300 hover:text-[#FCA311] transition flex items-center gap-1 font-semibold">
            <span>&larr;</span> Back to Home
          </Link>
          <Link to="/events" className="text-slate-300 hover:text-[#FCA311] transition font-semibold">
            Browse Events &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
