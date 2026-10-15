import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../services/userService.js';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Student profile form state
  const [formData, setFormData] = useState({
    batch: '',
    section: '',
    level: '',
    term: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState(null);

  // Organizer request state
  const [requestingOrganizer, setRequestingOrganizer] = useState(false);
  const [organizerMsg, setOrganizerMsg] = useState(null);
  const [organizerErrorMsg, setOrganizerErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        batch: user.batch || '',
        section: user.section || '',
        level: user.level !== null && user.level !== undefined ? String(user.level) : '',
        term: user.term !== null && user.term !== undefined ? String(user.term) : '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      const payload = {
        batch: formData.batch ? formData.batch.trim() : null,
        section: formData.section ? formData.section.trim() : null,
        level: formData.level ? Number(formData.level) || formData.level : null,
        term: formData.term ? Number(formData.term) || formData.term : null,
      };

      await userService.updateMyProfile(payload);
      await refreshUser();
      setProfileSuccessMsg('Student profile updated successfully!');
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOrganizerRequest = async () => {
    try {
      setRequestingOrganizer(true);
      setOrganizerMsg(null);
      setOrganizerErrorMsg(null);

      await userService.requestOrganizerAccess();
      await refreshUser();
      setOrganizerMsg('Your organizer application has been submitted and is pending administrative review.');
    } catch (err) {
      setOrganizerErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to submit organizer request'
      );
    } finally {
      setRequestingOrganizer(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'organizer':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Organizer</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Participant</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">None</span>;
    }
  };

  const canRequestOrganizer =
    user?.role === 'participant' &&
    (!user?.organizerStatus || user?.organizerStatus === 'none' || user?.organizerStatus === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{user?.name}</h1>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(user?.role)}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <span className="text-xs text-slate-400 block font-medium">Organizer Status</span>
            <div className="mt-1">{getStatusBadge(user?.organizerStatus)}</div>
          </div>
        </div>
      </div>

      {/* Organizer Request Card */}
      {canRequestOrganizer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Want to host university events?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Apply for organizer access to create, publish, and manage events on the BAUST Event Portal.
              </p>
            </div>
            <button
              onClick={handleOrganizerRequest}
              disabled={requestingOrganizer}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50 whitespace-nowrap"
            >
              {requestingOrganizer ? 'Submitting...' : 'Request Organizer Access'}
            </button>
          </div>

          {organizerMsg && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
              {organizerMsg}
            </div>
          )}

          {organizerErrorMsg && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
              {organizerErrorMsg}
            </div>
          )}
        </div>
      )}

      {user?.organizerStatus === 'pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Your organizer request is currently pending administrative review. We will notify you once approved.</span>
        </div>
      )}

      {/* Academic Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Academic Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep your university cohort details up to date for seamless event registration.
          </p>
        </div>

        {profileSuccessMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            {profileSuccessMsg}
          </div>
        )}

        {profileErrorMsg && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
            {profileErrorMsg}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batch */}
            <div>
              <label htmlFor="batch" className="block text-xs font-medium text-slate-700 mb-1">
                Batch
              </label>
              <input
                type="text"
                id="batch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g. 11th Batch, 12th Batch"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Section */}
            <div>
              <label htmlFor="section" className="block text-xs font-medium text-slate-700 mb-1">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A, B, C"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-xs font-medium text-slate-700 mb-1">
                Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
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
              <label htmlFor="term" className="block text-xs font-medium text-slate-700 mb-1">
                Term
              </label>
              <select
                id="term"
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="">Select Term</option>
                <option value="1">Term I</option>
                <option value="2">Term II</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
