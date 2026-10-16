import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, logout, isAuthenticated, user } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || location.state?.message || null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage || location.state?.message) {
      setSuccessMsg(location.state.successMessage || location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // If already logged in, show options
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
          <p className="text-sm text-slate-600 mb-4">
            You are currently logged in as <span className="font-semibold text-slate-800">{user.email}</span> ({user.role}).
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition"
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
      setSuccessMsg(null);
      setAccountNotFound(false);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      // Immediately clear Firebase session on failure
      try {
        await signOut(auth);
      } catch (signOutErr) {
        // ignore
      }

      const status = err.response?.status;
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Authentication failed';

      if (status === 404 || message.toLowerCase().includes('account not found')) {
        setErrorMsg('Account not found. Please create an account first.');
        setAccountNotFound(true);
      } else {
        setErrorMsg(message);
        setAccountNotFound(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50">
      {/* Toast Success Alert */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in bg-emerald-600 text-white border border-emerald-700">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 text-sm font-medium">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toast Error Alert */}
      {errorMsg && (
        <div className="fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in bg-rose-600 text-white border border-rose-700">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 text-sm font-medium">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <div className="text-center mb-6">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider mb-2">
            BAUST Event System
          </span>
          <h1 className="text-2xl font-bold text-slate-800">Sign In</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in with your Google account to access events and dashboard
          </p>
        </div>

        {accountNotFound && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span>⚠️</span>
              <span>Account Not Found</span>
            </div>
            <p className="mb-3">
              We couldn't find an existing account matching your Google account. Please create an account to get started.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
            >
              Go to Sign Up Page &rarr;
            </button>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-medium text-slate-700 text-sm shadow-sm disabled:opacity-50"
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
          <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign up with Google
            </Link>
          </p>
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
