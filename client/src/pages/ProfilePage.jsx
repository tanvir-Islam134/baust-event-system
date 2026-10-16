import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../services/userService.js';

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
  const [selectedClub, setSelectedClub] = useState('');
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
      if (user.clubAffiliation) {
        setSelectedClub(user.clubAffiliation);
      }
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

  const handleOrganizerRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClub) {
      setOrganizerErrorMsg('Please select a campus club from the list');
      return;
    }

    try {
      setRequestingOrganizer(true);
      setOrganizerMsg(null);
      setOrganizerErrorMsg(null);

      await userService.requestOrganizer({ clubAffiliation: selectedClub });
      await refreshUser();
      setOrganizerMsg(
        `Your organizer application for ${selectedClub} has been submitted! It is now pending administrative review.`
      );
    } catch (err) {
      setOrganizerErrorMsg(
        err.response?.data?.error?.message || err.message || 'Failed to submit organizer request'
      );
    } finally {
      setRequestingOrganizer(false);
    }
  };

  const currentStatus = user?.organizerRequestStatus || user?.organizerStatus || 'none';

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
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Pending Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">None</span>;
    }
  };

  const canApplyForOrganizer =
    user?.role === 'participant' && (currentStatus === 'none' || currentStatus === 'rejected');

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
                {user?.clubAffiliation && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    🏛️ {user.clubAffiliation}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            <span className="text-xs text-slate-400 block font-medium">Organizer Status</span>
            <div className="mt-1">{getStatusBadge(currentStatus)}</div>
          </div>
        </div>
      </div>

      {/* Organizer Access Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <h2 className="text-lg font-bold text-slate-800">Request Organizer Access</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organizers can publish events, manage registrations, record expenses, and run attendee polls.
            Each official BAUST club is strictly limited to a maximum of <strong>2 organizers</strong>.
          </p>
        </div>

        {/* Status: Approved */}
        {user?.role === 'organizer' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Verified Club Organizer</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              You are an active organizer for <strong>{user.clubAffiliation || 'your designated club'}</strong>.
              You have full permissions to create and manage events.
            </p>
          </div>
        )}

        {/* Status: Pending */}
        {currentStatus === 'pending' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Application Under Administrative Review</span>
            </div>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              You have requested organizer access for <strong>{user?.clubAffiliation || selectedClub}</strong>.
              University administrators will verify availability (maximum 2 organizers per club) and review your request shortly.
            </p>
          </div>
        )}

        {/* Status: Rejected */}
        {currentStatus === 'rejected' && canApplyForOrganizer && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <p className="font-semibold">Previous Request Status: Rejected</p>
            <p className="mt-0.5">
              Your previous application was not approved. You may submit a new application for a club below.
            </p>
          </div>
        )}

        {/* Application Form */}
        {canApplyForOrganizer && (
          <form onSubmit={handleOrganizerRequestSubmit} className="mt-4 space-y-4">
            {organizerMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
                {organizerMsg}
              </div>
            )}

            {organizerErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                {organizerErrorMsg}
              </div>
            )}

            <div>
              <label htmlFor="clubSelect" className="block text-xs font-semibold text-slate-700 mb-1">
                Select Your BAUST Club / Organization <span className="text-rose-500">*</span>
              </label>
              <select
                id="clubSelect"
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                disabled={requestingOrganizer}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">-- Choose an Official Club --</option>
                {BAUST_CLUBS.map((club) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Only select a club if you are an authorized student executive or committee member.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={requestingOrganizer || !selectedClub}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {requestingOrganizer ? 'Submitting Application...' : 'Submit Organizer Request'}
              </button>
            </div>
          </form>
        )}
      </div>

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
