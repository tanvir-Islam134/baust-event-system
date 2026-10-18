import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import registrationService from '../services/registrationService.js';
import adminService from '../services/adminService.js';
import ClubOrganizersDirectory from '../components/ClubOrganizersDirectory.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';

  // Admin: Organizers Directory state for Card 2
  const [organizersCount, setOrganizersCount] = useState(0);

  // Organizer: Pending Event Registrations state
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [processingRegId, setProcessingRegId] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Rejection modal state
  const [rejectingReg, setRejectingReg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchPendingRegistrations = useCallback(async () => {
    if (!isOrganizer) return;
    try {
      setLoadingRegistrations(true);
      const data = await registrationService.getOrganizerPendingRegistrations();
      setPendingRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load organizer pending registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  }, [isOrganizer]);

  const fetchAdminOrganizersCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await adminService.getApprovedOrganizers();
      setOrganizersCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.warn('Failed to load admin organizers count:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  useEffect(() => {
    fetchAdminOrganizersCount();
  }, [fetchAdminOrganizersCount]);

  const handleApproveRegistration = async (regId) => {
    try {
      setProcessingRegId(regId);
      await registrationService.approveRegistration(regId);
      showToast('Registration accepted successfully!');
      await fetchPendingRegistrations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to approve registration', 'error');
    } finally {
      setProcessingRegId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReg) return;
    try {
      setProcessingRegId(rejectingReg.id);
      await registrationService.rejectRegistration(rejectingReg.id, rejectReason);
      showToast('Registration rejected.');
      setRejectingReg(null);
      setRejectReason('');
      await fetchPendingRegistrations();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to reject registration', 'error');
    } finally {
      setProcessingRegId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in border ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-100 mb-3 border border-white/20">
            <span>BAUST Event System</span>
            <span>•</span>
            <span className="capitalize">{user?.role} Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Stay updated with all campus conferences, academic competitions, cultural fests, and sports tournaments.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/events"
              className="px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg text-sm hover:bg-blue-50 transition shadow-sm"
            >
              Browse Events
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-blue-600/60 hover:bg-blue-600 text-white font-medium rounded-lg text-sm transition border border-white/20"
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl" />
        <div className="absolute right-32 top-0 w-32 h-32 bg-blue-500/20 rounded-full pointer-events-none blur-xl" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Events</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">4 Active</h3>
            <p className="text-xs text-slate-500 mt-1">Upcoming campus events</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/events" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>View calendar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Registrations / Organizers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Organizers' : isOrganizer ? 'Queue' : 'Registrations'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">
              {isAdmin
                ? `${organizersCount} Approved`
                : isOrganizer
                ? `${pendingRegistrations.length} Pending`
                : '1 Ticket'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'Active club organizers'
                : isOrganizer
                ? 'Awaiting organizer approval'
                : 'Confirmed passes'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            {isAdmin ? (
              <a href="#organizers-directory" className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <span>View directory</span>
                <span>&darr;</span>
              </a>
            ) : isOrganizer ? (
              <a href="#pending-registrations" className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <span>Review registrations</span>
                <span>&darr;</span>
              </a>
            ) : (
              <Link to="/events" className="text-xs font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <span>Check tickets & QR</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Role & Access */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Access Level</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 capitalize">{user?.role || 'User'}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Organizer: <span className="capitalize">{user?.organizerStatus || 'None'}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/profile" className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1">
              <span>Manage privileges</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Card 4: Cohort Info or Financials */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isAdmin || isOrganizer ? 'Finances' : 'Cohort'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">
              {isAdmin || isOrganizer
                ? 'Overview'
                : user?.batch
                ? `${user.batch}`
                : 'Not Set'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin || isOrganizer
                ? 'Event ledgers & funds'
                : `Level ${user?.level || '-'}, Term ${user?.term || '-'}`}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to={isAdmin || isOrganizer ? '/finances' : '/profile'}
              className="text-xs font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <span>{isAdmin || isOrganizer ? 'Open finance portal' : 'Update cohort'}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ADMIN ONLY: Club Organizers Directory Section */}
      {isAdmin && (
        <div id="organizers-directory">
          <ClubOrganizersDirectory
            onNotify={(msg, type) => {
              showToast(msg, type);
              fetchAdminOrganizersCount();
            }}
          />
        </div>
      )}

      {/* ORGANIZER ONLY: Pending Event Registrations Section */}
      {isOrganizer && (
        <div id="pending-registrations" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/60 to-orange-50/40">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Pending Event Registrations</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {pendingRegistrations.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review and approve participant applications for events hosted by{' '}
                <span className="font-semibold text-indigo-700">
                  🏛️ {user?.clubAffiliation || 'Your Assigned Club'}
                </span>
                .
              </p>
            </div>

            <button
              onClick={fetchPendingRegistrations}
              disabled={loadingRegistrations}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-white rounded-lg text-xs font-medium text-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 shadow-sm"
            >
              <svg className={`w-3.5 h-3.5 ${loadingRegistrations ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh List</span>
            </button>
          </div>

          {/* Content Area */}
          {loadingRegistrations && (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Loading pending applications...</p>
            </div>
          )}

          {!loadingRegistrations && pendingRegistrations.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xl mb-2">
                ✓
              </div>
              <h3 className="text-sm font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                There are currently no pending participant registrations awaiting approval for {user?.clubAffiliation || 'your club'}.
              </p>
            </div>
          )}

          {!loadingRegistrations && pendingRegistrations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Cohort Details</th>
                    <th className="py-3 px-4">Options & Payment</th>
                    <th className="py-3 px-4 text-right">Review Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {pendingRegistrations.map((reg) => {
                    const isProcessing = processingRegId === reg.id;

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                        {/* Event Title & Date */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs truncate max-w-xs">
                              {reg.eventTitle}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              📅 {reg.eventDate || 'Date TBA'} {reg.eventVenue ? `• 📍 ${reg.eventVenue}` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Fee: {reg.eventFee > 0 ? `৳${reg.eventFee}` : 'Free'}
                            </span>
                          </div>
                        </td>

                        {/* Participant Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                              {reg.participantName ? reg.participantName.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate">
                                {reg.participantName}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {reg.participantEmail}
                              </span>
                              {reg.participantPhone && reg.participantPhone !== 'N/A' && (
                                <span className="text-[10px] text-slate-500 block">
                                  📞 {reg.participantPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cohort / Department */}
                        <td className="py-3.5 px-4">
                          {reg.isGuest ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Guest Participant
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {reg.department && (
                                <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                                  {reg.department}
                                </span>
                              )}
                              <span className="text-slate-600 block">
                                {reg.studentId ? `ID: ${reg.studentId}` : ''}
                                {reg.batch ? ` • ${reg.batch}` : ''}
                                {reg.section ? ` • Sec ${reg.section}` : ''}
                              </span>
                              {(reg.level || reg.term) && (
                                <span className="text-[11px] text-slate-400 block">
                                  {reg.level ? `L-${reg.level} ` : ''}
                                  {reg.term ? `T-${reg.term}` : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Options & Payment */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {(reg.tshirtSize || reg.foodType) && (
                              <div className="flex flex-wrap gap-1">
                                {reg.tshirtSize && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                                    👕 {reg.tshirtSize}
                                  </span>
                                )}
                                {reg.foodType && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200 capitalize">
                                    🍲 {reg.foodType}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold uppercase">
                                {reg.paymentMethod || 'cash'}
                              </span>
                              {reg.trxId && (
                                <span className="text-[11px] font-mono text-purple-700 font-medium">
                                  Trx: {reg.trxId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApproveRegistration(reg.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                            >
                              {isProcessing ? 'Saving...' : 'Accept'}
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingReg(reg);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Featured Campus Highlights */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Campus Event Highlights</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upcoming flagships scheduled at BAUST</p>
          </div>
          <Link to="/events" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Events &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-800 mb-2">
              Technology
            </span>
            <h4 className="text-sm font-bold text-slate-800">BAUST CSE Fest 2026</h4>
            <p className="text-xs text-slate-500 mt-1">
              Hackathon, competitive programming, project display, and gaming tournaments.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Nov 20, 2026</span>
              <span>•</span>
              <span>Central Auditorium</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 mb-2">
              Sports
            </span>
            <h4 className="text-sm font-bold text-slate-800">Inter-Department Cricket Tournament</h4>
            <p className="text-xs text-slate-500 mt-1">
              Annual championship clash between engineering and business faculties.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Dec 05, 2026</span>
              <span>•</span>
              <span>Main Campus Ground</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-800 mb-2">
              Cultural
            </span>
            <h4 className="text-sm font-bold text-slate-800">BAUST Cultural Gala Night</h4>
            <p className="text-xs text-slate-500 mt-1">
              Music, drama, arts exhibition, and award ceremony honoring student achievements.
            </p>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <span>Dec 18, 2026</span>
              <span>•</span>
              <span>Open Air Stage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organizer Rejection Reason Modal */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <span>⚠️</span>
                <h3>Reject Event Registration</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to reject the registration of{' '}
                <span className="font-semibold text-slate-800">{rejectingReg.participantName}</span> for{' '}
                <span className="font-semibold text-slate-800">{rejectingReg.eventTitle}</span>?
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for rejection (optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. bKash transaction ID invalid, duplicate ticket application..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectingReg(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingRegId === rejectingReg.id}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {processingRegId === rejectingReg.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
