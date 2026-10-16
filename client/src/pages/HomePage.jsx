import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md">
              B
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block">
                BAUST Event System
              </span>
              <span className="text-[10px] text-slate-500 block -mt-0.5">
                Saidpur Cantonment, Bangladesh
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/events"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              Events Catalog
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                Dashboard ({user?.role})
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Official University Event Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Campus Life, Connected. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              Discover & Organize Events with Ease.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The unified platform for Bangladesh Army University of Science and Technology.
            Explore technical hackathons, cultural festivals, academic symposiums, and sports championships with atomic seat reservation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/events"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5"
            >
              Explore Campus Events
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold shadow-sm transition"
              >
                Open Dashboard &rarr;
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold shadow-sm transition"
              >
                Sign In with Google
              </Link>
            )}
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-0" />
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Built for the BAUST Community
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Everything students, campus clubs, and university administration need in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-4">
                🎟️
              </div>
              <h3 className="text-base font-bold text-slate-800">Atomic Registrations</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                First-come first-served concurrency control ensures event seat capacities are strictly enforced with no double bookings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                👥
              </div>
              <h3 className="text-base font-bold text-slate-800">Role-Based Workflows</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Fine-grained permissions for students, verified club organizers, and university administrative controllers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="text-base font-bold text-slate-800">Financial Transparency</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Itemized expense ledgers and sponsor/alumni revenue accounting for total financial clarity across every event.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h3 className="text-base font-bold text-slate-800">Offline-Ready PWA</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Installable Progressive Web App with instant loading and seamless mobile responsiveness across all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-blue-950 text-white text-center">
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition"
            >
              Browse Public Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; 2026 Bangladesh Army University of Science and Technology (BAUST). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/events" className="hover:text-blue-600 transition">
              Events
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-blue-600 transition">
              Portal Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

