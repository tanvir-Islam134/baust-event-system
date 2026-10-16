import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PendingApprovalPage() {
  const { user, isAuthenticated, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // If session is still loading, show a clean spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Checking account status...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user is genuinely a pending organizer
  const isPending =
    (user.organizerRequestStatus === 'pending' || user.organizerStatus === 'pending') &&
    user.role !== 'organizer' &&
    user.role !== 'admin';

  // If already approved as organizer (or admin, or regular student without pending request), route to dashboard
  if (!isPending) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      setStatusMessage(null);
      const updated = await refreshUser();

      if (updated && (updated.role === 'organizer' || updated.role === 'admin')) {
        navigate('/dashboard', { replace: true });
      } else if (
        updated &&
        (updated.organizerRequestStatus === 'rejected' || updated.organizerStatus === 'rejected')
      ) {
        setStatusMessage({
          type: 'error',
          text: 'Your application was rejected by the administration.',
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Your application is still under review by the administration. Please check back shortly.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to verify status. Please try again.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur text-white mb-3 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Approval Pending</h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1">
            BAUST Event System • University Administration Review
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Notice Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Pending Admin Approval</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              Your Organizer account request is currently pending Admin approval. You will be able to access your account once accepted.
            </p>
          </div>

          {/* Applicant & Club Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Application Details
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Applicant Name</span>
                <span className="font-semibold text-slate-800">{user.name || 'BAUST User'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Registered Email</span>
                <span className="font-semibold text-slate-800">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Requested Club</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-[11px]">
                  🏛️ {user.clubAffiliation || 'Official Club'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Access Level</span>
                <span className="text-amber-700 font-medium">Dashboard access locked pending review</span>
              </div>
            </div>
          </div>

          {/* Status Message / Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border text-center ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Status...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Check Approval Status</span>
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              Logout
            </button>
          </div>

          {/* Public Events Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <Link
              to="/events"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition inline-flex items-center gap-1"
            >
              <span>Explore Public Campus Events</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

