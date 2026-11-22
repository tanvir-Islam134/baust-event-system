import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import campusBanner from '../assets/baust-campus.jpg';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

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
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-[#FCA311]/20 transition transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>Dashboard</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[#14213D] text-[#FCA311] font-bold capitalize">
                  {user?.role}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-slate-200 hover:text-white hover:bg-white/5 rounded-xl text-xs sm:text-sm font-semibold transition"
                >
                  Sign In
                </Link>
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

      {/* Hero Section: 2-Column High-End Showcase Layout */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#070E1E] via-[#0B132B] to-[#14213D] py-12 sm:py-16 lg:py-20 border-b border-white/10">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FCA311]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Authoritative Typography & Actions (7 Cols) */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Institution Pill Badge with Pulsing Live Dot */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#FCA311]/40 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span className="text-white text-xs font-bold tracking-wide">
                  BAUST Official Campus Portal
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[#FCA311] text-xs font-semibold">
                  Saidpur Cantonment
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Campus Life, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCA311] via-amber-300 to-amber-500">
                  Intelligently Connected.
                </span>
              </h1>

              {/* Subtitle / Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
                The centralized event management ecosystem for Bangladesh Army University of Science and Technology. 
                Discover hackathons, cultural festivals, and academic symposiums with atomic seat reservation and cryptographically signed QR gate passes.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/events"
                  className="px-7 py-3.5 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-extrabold shadow-lg shadow-[#FCA311]/25 hover:shadow-[#FCA311]/40 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Explore Campus Events</span>
                  <span className="text-base font-bold">&rarr;</span>
                </Link>

                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold shadow-sm transition transform hover:-translate-y-0.5 flex items-center gap-2.5"
                  >
                    <span>Open Dashboard</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#FCA311] text-[#14213D] font-extrabold capitalize">
                      {user?.role}
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 rounded-xl text-sm font-semibold transition"
                  >
                    Sign In with Google
                  </Link>
                )}
              </div>

              {/* Institutional Trust Perks */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Signed Digital QR Passes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Atomic Seat Locking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant Gate Camera Check-in</span>
                </div>
              </div>

            </div>

            {/* Right Column: Campus Showcase Frame with Clean Photo & Live Badges (5 Cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Showcase Container Frame */}
                <div className="relative rounded-3xl p-3 bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden group">
                  
                  {/* BAUST Campus Image - Bright, Vibrant, Pristine */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] bg-slate-800 shadow-inner">
                    <img
                      src={campusBanner}
                      alt="BAUST Campus Academic Building"
                      className="w-full h-full object-cover object-center transform group-hover:scale-102 transition duration-700 ease-out filter brightness-100 contrast-102"
                    />

                    {/* Subtle Top Floating Badge: BAUST Emblem & Title */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/25 shadow-lg">
                      <img
                        src="/baust-logo.png"
                        alt="BAUST Emblem"
                        className="w-5 h-5 rounded-full object-contain bg-white p-0.5"
                      />
                      <span className="text-white text-xs font-bold tracking-tight">
                        BAUST Main Campus
                      </span>
                    </div>

                    {/* Top Right Status Badge */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-[#FCA311] text-[#14213D] px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md">
                      <span>Saidpur</span>
                    </div>
                  </div>

                  {/* Clean Caption Bar under the photo */}
                  <div className="px-2 pt-3 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-white tracking-wide">
                      Bangladesh Army University of Science and Technology
                    </span>
                    <span className="text-[#FCA311] font-semibold text-[11px]">
                      Saidpur Cantonment
                    </span>
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
              <Link
                to="/login"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold transition"
              >
                Sign In to Student Portal
              </Link>
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
