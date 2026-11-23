import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../services/userService.js';
import { isParticipantProfileComplete } from '../utils/userUtils.js';

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

export default function OnboardingPage() {
  const { user, refreshUser, setUser, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science and Engineering (CSE)',
    studentId: '',
    mobileNumber: '',
    batch: '',
    section: 'A',
    level: 'Level 1',
    term: 'Term I',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Prepopulate with Google account info
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        department: user.department || prev.department,
        studentId: user.studentId || prev.studentId,
        mobileNumber: user.mobileNumber || prev.mobileNumber,
        batch: user.batch || prev.batch,
        section: user.section || prev.section,
        level: user.level ? String(user.level) : prev.level,
        term: user.term ? String(user.term) : prev.term,
      }));
      if (user.photoURL) {
        setPhotoPreview(user.photoURL);
      }
    }
  }, [user]);

  // If auth is still checking, wait
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070E1E] text-white">
        <div className="w-8 h-8 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated -> redirect home
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If already complete or not participant -> redirect to dashboard
  if (isParticipantProfileComplete(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const compressImage = (file, size = 320, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const minEdge = Math.min(img.width, img.height);
          const startX = (img.width - minEdge) / 2;
          const startY = (img.height - minEdge) / 2;
          ctx.drawImage(img, startX, startY, minEdge, minEdge, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Invalid image file'));
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
    });
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    try {
      setUploadingPhoto(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImage(file, 320, 0.85);
      setPhotoPreview(compressedDataUrl);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process image');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.department.trim()) {
      setErrorMsg('Please select your academic department.');
      return;
    }
    if (!formData.studentId.trim()) {
      setErrorMsg('Please enter your Student ID (e.g. 210201001).');
      return;
    }
    if (!formData.mobileNumber.trim()) {
      setErrorMsg('Please enter your active mobile number.');
      return;
    }
    if (!formData.batch.trim()) {
      setErrorMsg('Please enter your batch (e.g. 11th Batch).');
      return;
    }
    if (!formData.section.trim()) {
      setErrorMsg('Please select or enter your section.');
      return;
    }
    if (!formData.level.trim()) {
      setErrorMsg('Please select your current Level.');
      return;
    }
    if (!formData.term.trim()) {
      setErrorMsg('Please select your current Term.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        department: formData.department.trim(),
        studentId: formData.studentId.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        batch: formData.batch.trim(),
        section: formData.section.trim(),
        level: formData.level.trim(),
        term: formData.term.trim(),
      };

      if (photoPreview) {
        payload.photoURL = photoPreview;
      }

      const updated = await userService.updateMyProfile(payload);
      if (setUser) setUser(updated);
      if (refreshUser) await refreshUser();

      // Successfully saved! Go directly to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to save your academic profile. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-[#070E1E] via-[#0B132B] to-[#14213D] py-12">
      {/* Background Ambient Glows & Grid Pattern */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[#FCA311]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Hidden File Input for Avatar Photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="relative z-10 max-w-xl w-full bg-[#0d162a]/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 ring-1 ring-white/5 text-white">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white p-1 mx-auto mb-3 flex items-center justify-center ring-4 ring-[#FCA311]/30 shadow-xl shadow-[#FCA311]/15">
            <img
              src="/baust-logo.png"
              alt="BAUST University Crest"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-[#FCA311]/40 text-[#FCA311] text-[11px] font-bold uppercase tracking-wider mb-2 shadow-xs">
            <span>🎓 Participant Setup</span>
            <span className="text-white/40">•</span>
            <span className="text-emerald-400 font-semibold">One-Time Information</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Complete Your Academic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto font-normal">
            Welcome to BAUST Event System! Please fill in your student cohort details once to access your event dashboard, reserve seats, and receive cryptographically signed QR passes.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 backdrop-blur-md">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo Selector Section */}
          <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#14213D] ring-2 ring-[#FCA311]/50 flex items-center justify-center text-xl font-bold text-[#FCA311] shadow-inner flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-[#FCA311] text-[#14213D] rounded-full hover:bg-amber-400 shadow-md transition transform hover:scale-110 cursor-pointer"
                  title="Upload profile picture"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Profile Photo</p>
                <p className="text-[11px] text-slate-400">
                  {photoPreview ? 'Photo selected from Google / file' : 'Optional: click to upload a photo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-[#FCA311] text-xs font-bold rounded-xl border border-white/15 transition cursor-pointer"
            >
              {uploadingPhoto ? 'Processing...' : photoPreview ? 'Change' : 'Upload'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-[#FCA311]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Md. Tanvir Islam Masum"
                required
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              />
            </div>

            {/* Department */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Department <span className="text-[#FCA311]">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-[#0e182f] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              >
                {BAUST_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#0b1325] text-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student ID <span className="text-[#FCA311]">*</span>
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. 210201001"
                required
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number <span className="text-[#FCA311]">*</span>
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="e.g. 01700000000"
                required
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Batch <span className="text-[#FCA311]">*</span>
              </label>
              <input
                type="text"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g. 11th Batch, 12th Batch"
                required
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              />
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Section <span className="text-[#FCA311]">*</span>
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-[#0e182f] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              >
                <option value="A" className="bg-[#0b1325]">Section A</option>
                <option value="B" className="bg-[#0b1325]">Section B</option>
                <option value="C" className="bg-[#0b1325]">Section C</option>
                <option value="General" className="bg-[#0b1325]">General / N/A</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Level <span className="text-[#FCA311]">*</span>
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-[#0e182f] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              >
                <option value="Level 1" className="bg-[#0b1325]">Level 1</option>
                <option value="Level 2" className="bg-[#0b1325]">Level 2</option>
                <option value="Level 3" className="bg-[#0b1325]">Level 3</option>
                <option value="Level 4" className="bg-[#0b1325]">Level 4</option>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Term <span className="text-[#FCA311]">*</span>
              </label>
              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-[#0e182f] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:border-transparent transition"
              >
                <option value="Term I" className="bg-[#0b1325]">Term I</option>
                <option value="Term II" className="bg-[#0b1325]">Term II</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#FCA311] hover:bg-[#e5920d] text-[#14213D] rounded-xl text-sm font-black shadow-lg shadow-[#FCA311]/25 hover:shadow-[#FCA311]/40 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#14213D] border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Continue to Dashboard</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Signed in as: <strong className="text-white">{user.email}</strong></span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="text-slate-400 hover:text-white underline transition cursor-pointer"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
