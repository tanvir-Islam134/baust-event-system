import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../services/userService.js';

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

  // If not logged in, redirect to home page
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is pending or rejected
  const isPending =
    (user.organizerRequestStatus === 'pending' || user.organizerStatus === 'pending') &&
    user.role !== 'organizer' &&
    user.role !== 'admin';

  const isRejected =
    (user.organizerRequestStatus === 'rejected' || user.organizerStatus === 'rejected') &&
    user.role !== 'organizer' &&
    user.role !== 'admin';

  // If already approved as organizer (or admin, or regular student without any request), route to dashboard
  if (!isPending && !isRejected) {
    return <Navigate to="/dashboard" replace />;
  }

  // Real-time socket listener so approval or rejection reflects instantly
  useEffect(() => {
    if (!user) return;
    let socket = null;
    let isMounted = true;

    import('socket.io-client')
      .then(({ io }) => {
        if (!isMounted || !io) return;
        const socketUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        socket = io(socketUrl, { withCredentials: true, autoConnect: true });
        socket.emit('join_user_room', user);

        socket.on('organizer_status_updated', async () => {
          if (!isMounted) return;
          if (refreshUser) await refreshUser();
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [user, refreshUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
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
    } catch {
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
      <div className="text-center mb-5">
        <div className="w-16 h-16 rounded-full bg-white shadow-md border-2 border-slate-100 p-1.5 mx-auto mb-2 flex items-center justify-center">
          <img
            src="/baust-logo.png"
            alt="BAUST University Crest"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <h2 className="text-sm font-bold text-slate-800">BAUST Event System</h2>
        <p className="text-xs text-slate-500">Saidpur Cantonment</p>
      </div>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Top Header Banner */}
        <div
          className={`p-6 text-white text-center relative overflow-hidden ${
            isRejected
              ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-800'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur text-white mb-3 shadow-inner">
            {isRejected ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRejected ? 'Application Declined' : 'Approval Pending'}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            BAUST Event System • University Administration Review
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Notice Box */}
          {isRejected ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Organizer Privileges Declined</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                Your application for Organizer access for <span className="text-rose-900 font-bold">{user.clubAffiliation || 'the club'}</span> was not approved by administration.
              </p>
              {user.organizerRejectionReason && (
                <div className="mt-2 p-2.5 bg-white rounded-lg border border-rose-200 text-xs text-slate-700">
                  <span className="font-semibold text-rose-900">Feedback: </span>
                  {user.organizerRejectionReason}
                </div>
              )}
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                Your account is active as a <strong>Student Participant</strong>. You can participate in all campus events, or re-apply for another club from your profile.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Pending Admin Approval</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                Your Organizer account request is currently pending Admin approval. You will be able to access your account once accepted.
              </p>
            </div>
          )}

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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-[#E5E5E5] text-[#14213D] font-bold text-[11px]">
                  🏛️ {user.clubAffiliation || 'Official Club'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Access Level</span>
                <span className={isRejected ? 'text-slate-700 font-medium' : 'text-amber-700 font-medium'}>
                  {isRejected ? 'Student Participant' : 'Dashboard access locked pending review'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Message / Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border text-center ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-100 border-[#E5E5E5] text-[#14213D]'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {isRejected ? (
              <>
                <button
                  onClick={async () => {
                    try {
                      if (user?.uid || user?.id) {
                        localStorage.setItem(`baust_rejection_ack_${user.uid || user.id}`, 'true');
                      }
                      await userService.dismissRejectionNotice();
                      if (refreshUser) await refreshUser();
                    } catch (e) {
                      console.warn('Failed to dismiss rejection:', e);
                    }
                    navigate('/dashboard', { replace: true });
                  }}
                  className="w-full py-2.5 px-4 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-md shadow-[#FCA311]/20 transition"
                >
                  Continue to Student Dashboard &rarr;
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (user?.uid || user?.id) {
                        localStorage.setItem(`baust_rejection_ack_${user.uid || user.id}`, 'true');
                      }
                      await userService.dismissRejectionNotice();
                      if (refreshUser) await refreshUser();
                    } catch (e) {
                      console.warn('Failed to dismiss rejection:', e);
                    }
                    navigate('/profile', { replace: true });
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition"
                >
                  Go to Profile / Re-apply
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Public Events Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <Link
              to="/events"
              className="text-xs text-[#14213D] hover:text-[#FCA311] font-bold transition inline-flex items-center gap-1"
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
