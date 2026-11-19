import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E5E5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-full bg-white border border-[#E5E5E5] p-0.5 flex items-center justify-center shadow-xs ring-1 ring-[#FCA311]/30 flex-shrink-0 overflow-hidden">
              <img
                src="/baust-logo.png"
                alt="BAUST Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#14213D] block">
                BAUST Event System
              </span>
              <span className="text-[10px] text-slate-500 block -mt-0.5 font-medium">
                Saidpur Cantonment, Bangladesh
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/events"
              className="text-xs sm:text-sm font-bold text-[#14213D] hover:text-[#FCA311] transition"
            >
              Events Catalog
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#14213D] hover:bg-black text-[#FCA311] border border-[#FCA311]/40 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition"
              >
                Dashboard ({user?.role})
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[#14213D] hover:text-[#FCA311] rounded-lg text-xs sm:text-sm font-bold transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-lg text-xs sm:text-sm font-extrabold shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[560px] lg:min-h-[640px] flex items-center bg-slate-950">
        {/* Background Campus Photo with Left-to-Right Black to Transparent Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/baust-campus.jpg"
            alt="BAUST Campus"
            className="w-full h-full object-cover object-[center_right] sm:object-right filter brightness-95"
          />
          {/* Left-to-right black gradient: solid black on the left, fading to transparent on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 via-50% to-transparent" />
          {/* Subtle top & bottom vignette for perfect text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10 w-full">
          <div className="max-w-2xl text-left">
            {/* BAUST Official Crest Badge */}
            <div className="inline-flex items-center gap-3 mb-5 bg-black/60 backdrop-blur-md p-1.5 pr-4 rounded-full border border-[#FCA311]/30 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-[#FCA311]/40">
                <img
                  src="/baust-logo.png"
                  alt="BAUST Official Crest"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="text-white text-xs font-bold block leading-tight tracking-wide">
                  BAUST Event System
                </span>
                <span className="text-[#FCA311] text-[11px] block leading-tight font-medium">
                  Saidpur Cantonment, Bangladesh
                </span>
              </div>
            </div>

            {/* Pill Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCA311]/20 backdrop-blur-md border border-[#FCA311]/40 text-[#FCA311] text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#FCA311] animate-pulse"></span>
                <span>Official University Event Platform</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              Campus Life, <span className="text-[#FCA311]">Connected.</span> <br />
              <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-100">
                Discover &amp; Organize Events with Ease.
              </span>
            </h1>

            {/* Description Paragraph */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-200 max-w-xl leading-relaxed drop-shadow-sm font-normal">
              The unified platform for Bangladesh Army University of Science and Technology.
              Explore technical hackathons, cultural festivals, academic symposiums, and sports championships with atomic seat reservation.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/events"
                className="px-7 py-3.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-extrabold shadow-lg shadow-[#FCA311]/25 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>Explore Campus Events</span>
                <span className="text-base leading-none">&rarr;</span>
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-[#14213D] rounded-xl text-sm font-bold shadow-md transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Open Dashboard</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#14213D] text-[#FCA311] font-bold capitalize">
                    {user?.role}
                  </span>
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/register"
                    className="px-6 py-3.5 bg-[#14213D]/80 hover:bg-[#14213D] text-white backdrop-blur-md border border-[#FCA311]/30 rounded-xl text-sm font-semibold shadow-md transition"
                  >
                    Create Account with Google
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-3.5 text-slate-300 hover:text-[#FCA311] rounded-xl text-sm font-semibold transition"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-[#FAFAFA] border-y border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14213D]">
              Built for the BAUST Community
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Everything students, campus clubs, and university administration need in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FCA311] hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🎟️
              </div>
              <h3 className="text-base font-bold text-[#14213D] group-hover:text-[#FCA311] transition">Atomic Registrations</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                First-come first-served concurrency control ensures event seat capacities are strictly enforced with no double bookings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FCA311] hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                👥
              </div>
              <h3 className="text-base font-bold text-[#14213D] group-hover:text-[#FCA311] transition">Role-Based Workflows</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Fine-grained permissions for students, verified club organizers, and university administrative controllers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FCA311] hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                📊
              </div>
              <h3 className="text-base font-bold text-[#14213D] group-hover:text-[#FCA311] transition">Financial Transparency</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Itemized expense ledgers and sponsor/alumni revenue accounting for total financial clarity across every event.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FCA311] hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                📱
              </div>
              <h3 className="text-base font-bold text-[#14213D] group-hover:text-[#FCA311] transition">Offline-Ready PWA</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                Installable Progressive Web App with instant loading and seamless mobile responsiveness across all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-black via-[#14213D] to-black text-white text-center border-t border-[#1e2f52]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to participate in the next big event?
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
            Join your fellow students at BAUST. Sign in with your university Google account to view personalized schedules and passes.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/events"
              className="px-7 py-3.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-extrabold shadow-lg shadow-[#FCA311]/20 transition"
            >
              Browse Public Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/baust-logo.png" alt="BAUST" className="w-5 h-5 rounded-full object-contain" />
            <span>&copy; 2026 Bangladesh Army University of Science and Technology (BAUST). All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/events" className="hover:text-[#FCA311] font-semibold transition">
              Events
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-[#FCA311] font-semibold transition">
              Portal Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

