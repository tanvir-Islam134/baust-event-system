import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isParticipantProfileComplete } from '../utils/userUtils.js';
import campusBanner from '../assets/baust-campus.jpg';

export default function HomePage() {
  const { isAuthenticated, user, logout, loginWithGoogle, switchRole } = useAuth();
  const navigate = useNavigate();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [navRoleMenuOpen, setNavRoleMenuOpen] = useState(false);
  const [activeRoleMenuOpen, setActiveRoleMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authRole, setAuthRole] = useState(null);
  const [authError, setAuthError] = useState(null);

  const heroDropdownRef = useRef(null);
  const navDropdownRef = useRef(null);
  const activeRoleRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (heroDropdownRef.current && !heroDropdownRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setNavRoleMenuOpen(false);
      }
      if (activeRoleRef.current && !activeRoleRef.current.contains(event.target)) {
        setActiveRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (newRole) => {
    if (newRole === user?.role) {
      setActiveRoleMenuOpen(false);
      return;
    }
    try {
      setSwitchingRole(true);
      const existingClub = user?.roleProfiles?.organizer?.clubAffiliation || user?.clubAffiliation || null;
      await switchRole(newRole, existingClub);
      setActiveRoleMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleSignIn = async (role) => {
    try {
      setAuthLoading(true);
      setAuthRole(role);
      setAuthError(null);
      const res = await loginWithGoogle(role, null);
      setRoleMenuOpen(false);
      setNavRoleMenuOpen(false);
      const loggedUser = res?.user || user;
      if (role === 'participant' && !isParticipantProfileComplete(loggedUser)) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Sign-in failed:', err);
      let message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Sign-in failed. Please try again.';
      if (
        err?.code === 'auth/unauthorized-domain' ||
        (typeof message === 'string' && message.includes('unauthorized-domain'))
      ) {
        message = `Firebase Unauthorized Domain: Add ${window.location.hostname} in Firebase Console.`;
      }
      setAuthError(message);
    } finally {
      setAuthLoading(false);
      setAuthRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#FCA311] selection:text-[#14213D]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0B132B]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3.5 group transition">
            <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-md ring-2 ring-[#FCA311]/50 group-hover:ring-[#FCA311] transition flex-shrink-0">
              <img
                src="/baust-logo.png"
                alt="BAUST Emblem"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#FCA311] transition">
                  BAUST Event System
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FCA311]/20 text-[#FCA311] border border-[#FCA311]/40">
                  Official
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Saidpur Cantonment, Bangladesh
              </span>
            </div>
          </Link>

          {/* Nav Links & CTAs */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/events"
              className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-[#FCA311] transition flex items-center gap-1.5"
            >
              <span>Explore Events</span>
              <span className="text-xs text-[#FCA311]">↗</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-[#FCA311]/20 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Dashboard</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#14213D] text-[#FCA311] font-bold capitalize">
                    {user?.role}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (err) {
                      console.warn('Sign out failed:', err);
                    }
                  }}
                  className="text-xs font-semibold text-slate-300 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Header Sign In Button with Role Selector Popover */}
                <div className="relative" ref={navDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setNavRoleMenuOpen(!navRoleMenuOpen)}
                    className="px-3.5 py-2 text-slate-200 hover:text-white hover:bg-white/5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Sign In</span>
                    <svg
                      className={`w-3.5 h-3.5 text-[#FCA311] transition-transform duration-200 ${
                        navRoleMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {navRoleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#0d162a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#FCA311]/50 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10 text-left">
                      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                        <span className="text-xs font-black text-[#FCA311] uppercase tracking-wider block">
                          Sign in as
                        </span>
                        <span className="text-[10px] text-slate-300">Select role to sign in directly</span>
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleSignIn('participant')}
                          disabled={authLoading}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                        >
                          <span className="text-base">🎓</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>Participant</span>
                              {authLoading && authRole === 'participant' && (
                                <span className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">Join events & browse clubs</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSignIn('organizer')}
                          disabled={authLoading}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                        >
                          <span className="text-base">🛡️</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>Organizer</span>
                              {authLoading && authRole === 'organizer' && (
                                <span className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">Manage club, create events</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSignIn('admin')}
                          disabled={authLoading}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/10 text-white transition cursor-pointer"
                        >
                          <span className="text-base">🏛️</span>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>Admin</span>
                              {authLoading && authRole === 'admin' && (
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

                <Link
                  to="/register"
                  className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-[#FCA311]/25 transition transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section: 2-Column High-End Showcase Layout with 3D Cybernetic Depth */}
      <section className="relative bg-gradient-to-b from-[#070E1E] via-[#0B132B] to-[#14213D] py-12 sm:py-16 lg:py-20 border-b border-white/10 [perspective:1400px]">
        {/* 3D Atmospheric Background Layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Ambient 3D Glowing Dimensional Orbs */}
          <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-[#FCA311]/15 rounded-full blur-[130px]" />
          <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[120px]" />

          {/* 3D Holographic Perspective Floor Grid */}
          <div
            className="absolute inset-x-0 bottom-0 h-[380px] opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(252, 163, 17, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(252, 163, 17, 0.15) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'bottom center',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 100%)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Authoritative Typography & Actions (5 Cols on Large Screens) */}
            <div className="lg:col-span-5 text-left space-y-5">
              
              {/* Institution Pill Badge with Pulsing Live Dot */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#FCA311]/40 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span className="text-white text-xs font-bold tracking-wide">
                  BAUST Official Campus Portal
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[#FCA311] text-xs font-semibold">
                  Saidpur
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.14]">
                Campus Life, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCA311] via-amber-300 to-amber-500">
                  Intelligently Connected.
                </span>
              </h1>

              {/* Subtitle / Description */}
              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal">
                The centralized event management ecosystem for Bangladesh Army University of Science and Technology. 
                Discover hackathons, cultural festivals, and academic symposiums with atomic seat reservation and cryptographically signed QR gate passes.
              </p>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/events"
                  className="px-6 py-3.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-[0_8px_20px_-4px_rgba(252,163,17,0.45),0_3px_0_0_#c47d06] hover:shadow-[0_12px_25px_-4px_rgba(252,163,17,0.55),0_4px_0_0_#c47d06] active:shadow-[0_2px_0_0_#c47d06] active:translate-y-1 transition-all transform flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Campus Events</span>
                  <span className="text-base font-bold">&rarr;</span>
                </Link>

                {isAuthenticated ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/dashboard"
                      className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold shadow-sm transition transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <span>Open Dashboard</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#FCA311] text-[#14213D] font-extrabold capitalize">
                        {user?.role}
                      </span>
                    </Link>

                    {/* Quick Active Role Switcher */}
                    <div className="relative" ref={activeRoleRef}>
                      <button
                        type="button"
                        onClick={() => setActiveRoleMenuOpen(!activeRoleMenuOpen)}
                        className="px-3.5 py-3 bg-[#14213D]/90 hover:bg-[#14213D] text-[#FCA311] border border-[#FCA311]/50 hover:border-[#FCA311] rounded-xl text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                        title="Switch role directly (Participant / Organizer / Admin)"
                      >
                        <span>🔄</span>
                        <span className="text-slate-300 text-xs hidden sm:inline">Role:</span>
                        <span className="capitalize font-black text-white">{user?.role}</span>
                        <svg
                          className={`w-3.5 h-3.5 text-[#FCA311] transition-transform duration-200 ${
                            activeRoleMenuOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {activeRoleMenuOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-[#0d162a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#FCA311] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-2 ring-[#FCA311]/30 text-left">
                          <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                            <p className="text-[10px] font-extrabold text-[#FCA311] uppercase tracking-wider">
                              Switch Active Role
                            </p>
                            <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                              {user?.email}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleRoleSwitch('participant')}
                              disabled={switchingRole}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                                user?.role === 'participant' ? 'bg-[#FCA311]/20 text-[#FCA311] font-bold border border-[#FCA311]/40' : 'text-slate-200 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">🎓</span>
                                <div className="text-left">
                                  <div className="font-bold text-white">Participant</div>
                                  <div className="text-[10px] text-slate-400">Join events & passes</div>
                                </div>
                              </div>
                              {user?.role === 'participant' && <span className="text-emerald-400 font-bold">✓</span>}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRoleSwitch('organizer')}
                              disabled={switchingRole}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                                user?.role === 'organizer' ? 'bg-[#FCA311]/20 text-[#FCA311] font-bold border border-[#FCA311]/40' : 'text-slate-200 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">🛡️</span>
                                <div className="text-left">
                                  <div className="font-bold text-white">Organizer</div>
                                  <div className="text-[10px] text-slate-400">Manage club, create events</div>
                                </div>
                              </div>
                              {user?.role === 'organizer' && <span className="text-emerald-400 font-bold">✓</span>}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRoleSwitch('admin')}
                              disabled={switchingRole}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                                user?.role === 'admin' ? 'bg-[#FCA311]/20 text-[#FCA311] font-bold border border-[#FCA311]/40' : 'text-slate-200 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">🏛️</span>
                                <div className="text-left">
                                  <div className="font-bold text-white">Admin</div>
                                  <div className="text-[10px] text-slate-400">Governance & approvals</div>
                                </div>
                              </div>
                              {user?.role === 'admin' && <span className="text-emerald-400 font-bold">✓</span>}
                            </button>
                          </div>
                          {switchingRole && (
                            <div className="px-3 py-1.5 text-center text-xs text-[#FCA311] bg-white/5 rounded-lg mt-1 flex items-center justify-center gap-2">
                              <div className="w-3 h-3 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                              <span>Switching role...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logout();
                        } catch (err) {
                          console.warn('Sign out failed:', err);
                        }
                      }}
                      className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-sm font-bold shadow-sm transition transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                      title="Sign out from your account"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative inline-block" ref={heroDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                      className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 hover:border-[#FCA311]/60 rounded-xl text-sm font-semibold transition-all shadow-[0_6px_20px_-4px_rgba(0,0,0,0.6),0_2px_0_0_rgba(255,255,255,0.15)] active:translate-y-0.5 flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
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
                      <span>Sign In with Google</span>
                      <svg
                        className={`w-3.5 h-3.5 text-[#FCA311] transition-transform duration-200 ${
                          roleMenuOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Popover Menu matching user drawing: positioned on the SIDE (to the right) */}
                    {roleMenuOpen && (
                      <div className="absolute z-50 left-0 top-full mt-2.5 sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:mt-0 sm:ml-4 w-72 sm:w-80 bg-[#0d162a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#FCA311] p-3 animate-in fade-in zoom-in-95 duration-150 ring-2 ring-[#FCA311]/30 text-left">
                        {/* Visual indicator arrow pointing directly left to the Sign In with Google button */}
                        <div className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#0d162a] border-l border-b border-[#FCA311] rotate-45 pointer-events-none" />

                        <div className="px-3 py-1.5 border-b border-white/10 mb-2">
                          <span className="text-xs font-black text-[#FCA311] uppercase tracking-wider block">
                            Sign in as
                          </span>
                          <span className="text-[10px] text-slate-300">Choose your role to sign in directly</span>
                        </div>

                        {authError && (
                          <div className="mb-2.5 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                            {authError}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleSignIn('participant')}
                            disabled={authLoading}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition hover:bg-white/10 text-white group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#FCA311] group-hover:text-[#14213D] text-[#FCA311] flex items-center justify-center flex-shrink-0 transition font-bold text-lg shadow-xs">
                              🎓
                            </div>
                            <div className="flex-1">
                              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FCA311] transition flex items-center justify-between">
                                <span>Participant</span>
                                {authLoading && authRole === 'participant' && (
                                  <span className="w-3.5 h-3.5 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-300">Join clubs, browse events & passes</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSignIn('organizer')}
                            disabled={authLoading}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition hover:bg-white/10 text-white group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#FCA311] group-hover:text-[#14213D] text-[#FCA311] flex items-center justify-center flex-shrink-0 transition font-bold text-lg shadow-xs">
                              🛡️
                            </div>
                            <div className="flex-1">
                              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FCA311] transition flex items-center justify-between">
                                <span>Organizer</span>
                                {authLoading && authRole === 'organizer' && (
                                  <span className="w-3.5 h-3.5 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-300">Manage club, publish events & finances</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSignIn('admin')}
                            disabled={authLoading}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition hover:bg-white/10 text-white group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#FCA311] group-hover:text-[#14213D] text-[#FCA311] flex items-center justify-center flex-shrink-0 transition font-bold text-lg shadow-xs">
                              🏛️
                            </div>
                            <div className="flex-1">
                              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FCA311] transition flex items-center justify-between">
                                <span>Admin</span>
                                {authLoading && authRole === 'admin' && (
                                  <span className="w-3.5 h-3.5 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-300">Oversee clubs, approvals & governance</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Institutional Trust Perks */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Signed Digital QR Passes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Atomic Seat Locking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant Gate Camera Check-in</span>
                </div>
              </div>

            </div>

            {/* Right Column: 3D Holographic Campus Showcase Frame */}
            <div className="lg:col-span-7 relative w-full pt-4 sm:pt-0">
              <div 
                className="relative mx-auto w-full group transition-all duration-700 ease-out sm:[transform:perspective(1200px)_rotateY(-5deg)_rotateX(2.5deg)] hover:[transform:perspective(1200px)_rotateY(0deg)_rotateX(0deg)_translateZ(8px)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Multi-Layer Ambient Atmospheric Glow Aura behind the artwork */}
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#FCA311]/30 via-purple-600/30 to-cyan-500/25 blur-3xl opacity-75 group-hover:opacity-100 transition duration-700 pointer-events-none" />
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-[#FCA311]/40 via-purple-500/20 to-blue-600/30 blur-xl opacity-60 pointer-events-none" />

                {/* Showcase Container: Precision 3D Beveled Frame with Deep Drop Shadow */}
                <div className="relative rounded-2xl sm:rounded-3xl p-[1.5px] bg-gradient-to-br from-[#FCA311]/70 via-white/30 to-purple-500/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(252,163,17,0.15)] overflow-hidden ring-1 ring-white/15">
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A1224]">
                    {/* Full 16:9 Aspect Video Container - 100% Edge-to-Edge */}
                    <div className="relative rounded-t-2xl sm:rounded-t-3xl overflow-hidden aspect-video w-full bg-slate-900">
                      <img
                        src={campusBanner}
                        alt="BAUST Campus Academic Building"
                        className="w-full h-full object-cover object-center transform group-hover:scale-102 transition duration-700 ease-out"
                      />
                      {/* Subtle Cinematic Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1224] via-transparent to-black/25 pointer-events-none" />
                    </div>

                    {/* Integrated University Caption Bar */}
                    <div className="px-4 py-3 bg-[#0A1224] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/baust-logo.png"
                          alt="BAUST Logo"
                          className="w-5 h-5 rounded-full object-contain bg-white p-0.5 shadow-sm flex-shrink-0 ring-1 ring-[#FCA311]/40"
                        />
                        <span className="font-extrabold text-white tracking-wide">
                          Bangladesh Army University of Science and Technology
                        </span>
                      </div>
                      <span className="text-[#FCA311] font-bold text-[11px] tracking-wider sm:self-center">
                        Saidpur Cantonment
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Institutional Key Metrics Strip */}
      <section className="bg-[#0B132B] border-b border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-[#FCA311]">4+</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Campus Clubs &amp; Societies</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Atomic Seat Concurrency</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-blue-400">&lt; 1s</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">QR Camera Gate Check-in</div>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">24/7</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">PWA Cloud Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Flow */}
      <section className="py-16 bg-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#FCA311] block mb-2">
              Simple &amp; Seamless Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              How the Event System Works
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              From discovering campus events to checking in at the gate with your digital pass.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311]/50 transition group relative">
              <div className="w-10 h-10 rounded-xl bg-[#FCA311] text-[#14213D] font-black text-sm flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#FCA311] transition">
                Browse &amp; Register
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Explore upcoming hackathons, symposiums, and cultural events. Reserve seats instantly with real-time capacity checks.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311]/50 transition group relative">
              <div className="w-10 h-10 rounded-xl bg-[#FCA311] text-[#14213D] font-black text-sm flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#FCA311] transition">
                Get Signed Digital Pass
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Receive an official university event pass embedded with a cryptographically signed HMAC QR code for offline verification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311]/50 transition group relative">
              <div className="w-10 h-10 rounded-xl bg-[#FCA311] text-[#14213D] font-black text-sm flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#FCA311] transition">
                Instant Gate Check-in
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Club organizers scan your pass with a smartphone camera at the venue gate for instant 1-second admission with zero duplicate entries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid: Core Architecture */}
      <section className="py-16 bg-[#070E1E] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Built Specifically for BAUST
            </h2>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Enterprise-grade event workflows tailored for students, campus club executives, and university administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311] hover:bg-white/[0.08] transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🎟️
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#FCA311] transition">
                Digital Pass &amp; QR Scan
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
                Cryptographically signed tickets verified in milliseconds via built-in camera gate scanner with live audio feedback.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311] hover:bg-white/[0.08] transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#FCA311] transition">
                Atomic Seat Locking
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
                Strict database concurrency guards prevent race conditions and eliminate double bookings during high-traffic registrations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311] hover:bg-white/[0.08] transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🏛️
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#FCA311] transition">
                Club Governance
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
                Dedicated dashboards for CSE Society, Cultural Club, and Alumni Society with quota limits and verified organizer roles.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FCA311] hover:bg-white/[0.08] transition duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/40 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                📊
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#FCA311] transition">
                Financial Transparency
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
                Itemized expense tracking, sponsor income records, and approved audit trails providing complete clarity for every event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-gradient-to-r from-[#0B132B] via-[#14213D] to-[#0B132B] text-white text-center border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FCA311]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="w-14 h-14 rounded-full bg-white p-1 mx-auto mb-5 shadow-lg ring-2 ring-[#FCA311]/50 flex items-center justify-center">
            <img src="/baust-logo.png" alt="BAUST" className="w-full h-full object-contain rounded-full" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Ready to participate in the next campus event?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join your fellow students at BAUST. Sign in with your university account to explore upcoming seminars, hackathons, and sports meets.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/events"
              className="px-8 py-3.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-extrabold shadow-lg shadow-[#FCA311]/25 transition transform hover:-translate-y-0.5"
            >
              Browse Public Events Catalog &rarr;
            </Link>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setRoleMenuOpen(true);
                }}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 hover:border-[#FCA311]/50 rounded-xl text-sm font-bold transition cursor-pointer"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </section>

      {/* University Footer */}
      <footer className="mt-auto py-8 bg-[#070E1E] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <img src="/baust-logo.png" alt="BAUST" className="w-5 h-5 rounded-full object-contain bg-white p-0.5" />
            <span>&copy; {new Date().getFullYear()} Bangladesh Army University of Science and Technology (BAUST). All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <Link to="/events" className="hover:text-[#FCA311] font-semibold transition">
              Events
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-[#FCA311] font-semibold transition">
              Portal Sign In
            </Link>
            <span>•</span>
            <span className="text-slate-500">Saidpur Cantonment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
