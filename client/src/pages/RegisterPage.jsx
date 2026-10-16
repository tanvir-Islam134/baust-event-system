import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export const BAUST_DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Electrical and Electronic Engineering (EEE)',
  'Civil Engineering (CE)',
  'Mechanical Engineering (ME)',
  'Industrial and Production Engineering (IPE)',
  'Business Administration (BBA)',
  'English',
  'Other / General',
];

export const BAUST_CLUBS = [
  'BAUST Computer Club (BCC)',
  'Career Society of BAUST (CSB)',
  'Environment and Sustainability Club (ESC)',
  'Civil Engineering Innovation Club (CEIC)',
  'CSE Society of BAUST',
  'BAUST Business Club',
  'BAUST Career Club',
  'BAUST Debating Society',
  'IEEE Student Branch, BAUST',
  'IEOM BAUST Student Chapter',
  'Cultural Club, BAUST',
  'BAUST Sports Club',
  'BAUST Robotics Club',
  'BAUST Photography Club',
  'BAUST Language Club',
  'BAUST Social Welfare Club',
  'BAUST Science Club',
  'BAUST Entrepreneurship Club',
  'BAUST Volunteer Club',
  'English Language and Literary Society (ELLS)',
  'BAUST Alumni Society',
];

export default function RegisterPage() {
  const { completeRegistration, logout, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Step 1: Firebase Google Auth State
  const [firebaseAuthData, setFirebaseAuthData] = useState(null);

  // Step 2: Comprehensive Form State
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    studentId: '',
    batch: '',
    section: '',
    level: '',
    term: '',
    mobileNumber: '',
    accountType: 'Student', // 'Student' | 'Organizer'
    clubAffiliation: '',
  });

  // If already logged in, show options
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
          <p className="text-sm text-slate-600 mb-4">
            You already have an active session as <span className="font-semibold text-slate-800">{user.email}</span> ({user.role}).
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

  // Step 1: Authenticate with Google (DO NOT call backend register yet)
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();

      // Check with backend if this user already exists in the database
      let userAlreadyExists = false;
      try {
        const checkRes = await api.post('/auth/login', { firebaseToken: token });
        if (checkRes.status === 200 || checkRes.data?.success) {
          userAlreadyExists = true;
        }
      } catch (checkErr) {
        const status = checkErr.response?.status;
        const message =
          checkErr.response?.data?.error?.message ||
          checkErr.response?.data?.message ||
          checkErr.message ||
          '';

        // 404 confirms the user DOES NOT exist in the database (expected for new signups)
        if (status === 404 || message.toLowerCase().includes('account not found')) {
          userAlreadyExists = false;
        } else {
          // Genuine network or server error occurred
          throw checkErr;
        }
      }

      // If the backend confirms the user ALREADY EXISTS:
      // 1. Call Firebase signOut(auth) immediately
      // 2. Redirect to /login with toast message: "You have already signed up. Please log in."
      if (userAlreadyExists) {
        try {
          await signOut(auth);
        } catch (signOutErr) {
          // ignore
        }
        navigate('/login', {
          replace: true,
          state: {
            message: 'You have already signed up. Please log in.',
            from,
          },
        });
        return;
      }

      // If backend confirms the user DOES NOT exist:
      // Reveal the multi-step registration form
      setFirebaseAuthData({
        user: result.user,
        token,
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
      });

      setFormData((prev) => ({
        ...prev,
        name: result.user.displayName || prev.name,
      }));
    } catch (err) {
      try {
        await signOut(auth);
      } catch (signOutErr) {
        // ignore
      }
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Google authentication failed';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Switch or reset Google account
  const handleResetGoogleAuth = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      // ignore
    }
    setFirebaseAuthData(null);
    setErrorMsg(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 2: Submit comprehensive registration form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseAuthData || !firebaseAuthData.token) {
      setErrorMsg('Please connect with Google first.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }

    if (formData.accountType === 'Organizer' && !formData.clubAffiliation) {
      setErrorMsg('Please select a Club / Society for your Organizer request.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const payload = {
        firebaseToken: firebaseAuthData.token,
        uid: firebaseAuthData.uid,
        email: firebaseAuthData.email,
        name: formData.name.trim(),
        department: formData.department.trim() || null,
        studentId: formData.studentId.trim() || null,
        batch: formData.batch.trim() || null,
        section: formData.section.trim() || null,
        level: formData.level ? String(formData.level).trim() : null,
        term: formData.term ? String(formData.term).trim() : null,
        mobileNumber: formData.mobileNumber.trim() || null,
        accountType: formData.accountType,
        requestedRole: formData.accountType,
        clubAffiliation: formData.accountType === 'Organizer' ? formData.clubAffiliation : null,
      };

      await completeRegistration(payload);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed';

      if (status === 409 || message.toLowerCase().includes('already exists')) {
        try {
          await signOut(auth);
        } catch (signOutErr) {
          // ignore
        }
        navigate('/login', {
          replace: true,
          state: {
            message: 'You have already signed up. Please log in.',
            from,
          },
        });
        return;
      }

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 py-12">
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

      {/* STEP 1: INITIAL GOOGLE AUTH PROMPT */}
      {!firebaseAuthData ? (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-slate-200">
          <div className="text-center mb-6">
            <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
              BAUST Event System
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Create an Account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign up with your Google account to discover events and manage campus registrations
            </p>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Verifying account...' : 'Sign up with Google'}</span>
          </button>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
            <Link to="/" className="text-slate-400 hover:text-slate-600">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      ) : (
        /* STEP 2: COMPREHENSIVE REGISTRATION FORM */
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Top Banner: Connected Account */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-blue-100 mb-1">
                <span>Step 2 of 2</span>
                <span>•</span>
                <span>Profile Setup</span>
              </div>
              <h2 className="text-lg font-bold">Complete Your Profile</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Connected with: <span className="font-semibold">{firebaseAuthData.email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetGoogleAuth}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-medium transition self-start sm:self-auto"
            >
              Switch Account
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Account Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Student */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    formData.accountType === 'Student'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="Student"
                    checked={formData.accountType === 'Student'}
                    onChange={handleChange}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">🎓 Student Account</span>
                    <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                      Explore events, register for tickets, and participate in campus activities.
                    </span>
                  </div>
                </label>

                {/* Option 2: Organizer */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    formData.accountType === 'Organizer'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="Organizer"
                    checked={formData.accountType === 'Organizer'}
                    onChange={handleChange}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">🏛️ Club Organizer</span>
                    <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                      Request permission to organize and manage events for an official BAUST club.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Dynamic Club Dropdown if Organizer is selected */}
            {formData.accountType === 'Organizer' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <label htmlFor="clubAffiliation" className="block text-xs font-bold text-indigo-950">
                    Select Club / Society <span className="text-rose-500">*</span>
                  </label>
                </div>
                <select
                  id="clubAffiliation"
                  name="clubAffiliation"
                  value={formData.clubAffiliation}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-indigo-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">-- Choose an Official BAUST Club --</option>
                  {BAUST_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Notice: Your organizer role request will be submitted to University Administration for review.
                  Each club is strictly capped at a <strong>maximum of 2 organizers</strong>.
                </p>
              </div>
            )}

            {/* Student & Academic Profile Fields */}
            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Personal & Academic Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-xs font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select Department</option>
                    {BAUST_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student ID */}
                <div>
                  <label htmlFor="studentId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 210101045"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 01712345678"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Batch */}
                <div>
                  <label htmlFor="batch" className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 11th Batch"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Section */}
                <div>
                  <label htmlFor="section" className="block text-xs font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g. A, B"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Level */}
                <div>
                  <label htmlFor="level" className="block text-xs font-semibold text-slate-700 mb-1">
                    Level
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select Level</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </div>

                {/* Term */}
                <div>
                  <label htmlFor="term" className="block text-xs font-semibold text-slate-700 mb-1">
                    Term
                  </label>
                  <select
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">Select Term</option>
                    <option value="1">Term I</option>
                    <option value="2">Term II</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetGoogleAuth}
                className="text-xs text-slate-500 hover:text-slate-700 order-2 sm:order-1"
              >
                &larr; Cancel and restart
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 order-1 sm:order-2"
              >
                {loading ? 'Submitting Registration...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
