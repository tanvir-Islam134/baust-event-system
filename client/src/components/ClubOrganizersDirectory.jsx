import React, { useState, useEffect, useCallback, useMemo } from 'react';
import adminService from '../services/adminService.js';

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

export default function ClubOrganizersDirectory({ onNotify }) {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grouped'

  // Demote Modal State
  const [demotingUser, setDemotingUser] = useState(null);
  const [processingDemote, setProcessingDemote] = useState(false);

  // Local Toast (if parent doesn't provide onNotify)
  const [localToast, setLocalToast] = useState(null);

  const notify = (message, type = 'success') => {
    if (onNotify) {
      onNotify(message, type);
    } else {
      setLocalToast({ message, type });
      setTimeout(() => setLocalToast(null), 5000);
    }
  };

  const fetchOrganizers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApprovedOrganizers();
      setOrganizers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch organizers list';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  // Handle Demote / Remove
  const handleConfirmDemote = async () => {
    if (!demotingUser) return;
    try {
      setProcessingDemote(true);
      await adminService.demoteOrganizer(demotingUser.id);
      notify(
        `Organizer access removed for ${demotingUser.name || 'user'}. Account reverted to Student role.`,
        'success'
      );
      setDemotingUser(null);
      await fetchOrganizers();
    } catch (err) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to demote organizer';
      notify(errMsg, 'error');
    } finally {
      setProcessingDemote(false);
    }
  };

  // Filtered list
  const filteredOrganizers = useMemo(() => {
    return organizers.filter((org) => {
      const clubName = org.clubName || org.clubAffiliation || 'Unassigned';
      if (selectedClub !== 'ALL' && clubName !== selectedClub) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (org.name || '').toLowerCase().includes(query);
        const matchesEmail = (org.email || '').toLowerCase().includes(query);
        const matchesId = (org.studentId || '').toLowerCase().includes(query);
        const matchesDept = (org.department || '').toLowerCase().includes(query);
        const matchesClub = clubName.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesId || matchesDept || matchesClub;
      }
      return true;
    });
  }, [organizers, selectedClub, searchTerm]);

  // Grouped by Club Map
  const groupedByClub = useMemo(() => {
    const map = {};

    // Initialize all clubs for comprehensive directory view
    BAUST_CLUBS.forEach((club) => {
      map[club] = [];
    });

    // Populate with organizers
    organizers.forEach((org) => {
      const club = org.clubName || org.clubAffiliation || 'Other / Unassigned';
      if (!map[club]) {
        map[club] = [];
      }
      map[club].push(org);
    });

    return map;
  }, [organizers]);

  // Stats
  const stats = useMemo(() => {
    const total = organizers.length;
    const clubsWithOrg = new Set(
      organizers.map((o) => o.clubName || o.clubAffiliation).filter(Boolean)
    ).size;
    let fullCapacityClubs = 0;
    Object.values(groupedByClub).forEach((list) => {
      if (list.length >= 2) fullCapacityClubs += 1;
    });
    return { total, clubsWithOrg, fullCapacityClubs };
  }, [organizers, groupedByClub]);

  return (
    <div className="space-y-4">
      {/* Local Toast Alert if rendered standalone */}
      {localToast && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in border ${
            localToast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <div className="flex-1 text-sm font-medium">{localToast.message}</div>
          <button onClick={() => setLocalToast(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header & Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-blue-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Club Organizers Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official directory of approved club executives & organizers (Max 2 per club).
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>{stats.total} Active Organizers</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>🏛️ {stats.clubsWithOrg} Clubs Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span>🔒 {stats.fullCapacityClubs} Clubs Full (2/2)</span>
              </span>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, student ID, department, or club..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Club Filter & View Modes */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Club Dropdown */}
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                aria-label="Filter by Club or Society"
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm max-w-xs truncate"
              >
                <option value="ALL">🏛️ All Clubs & Societies</option>
                {BAUST_CLUBS.map((club) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle: Table vs Grouped */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'table'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Directory Table View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                    viewMode === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grouped by Club Cards"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Grouped by Club</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchOrganizers}
                disabled={loading}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                title="Reload directory"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-500">Loading organizers directory...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-xl mb-3">
              ⚠️
            </div>
            <h3 className="text-sm font-bold text-slate-800">Error Loading Organizers</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchOrganizers}
              className="mt-4 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredOrganizers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center text-xl mb-3">
              🔍
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Organizers Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedClub !== 'ALL'
                ? 'No approved organizers match your active search filters.'
                : 'There are currently no approved club organizers registered in the database.'}
            </p>
            {(searchTerm || selectedClub !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClub('ALL');
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* VIEW 1: Directory Table View (Sorted by Club/Society) */}
        {!loading && !error && filteredOrganizers.length > 0 && viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Club / Society</th>
                  <th className="py-3.5 px-4">Organizer Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrganizers.map((org, idx) => {
                  const clubName = org.clubName || org.clubAffiliation || 'Unassigned';
                  // Visual divider helper if club changes
                  const prevOrg = idx > 0 ? filteredOrganizers[idx - 1] : null;
                  const isNewClubSection = !prevOrg || (prevOrg.clubName || prevOrg.clubAffiliation) !== clubName;

                  return (
                    <tr
                      key={org.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isNewClubSection ? 'border-t-2 border-slate-200/60' : ''
                      }`}
                    >
                      {/* Column 1: Club/Society */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 text-sm flex-shrink-0">
                            🏛️
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs leading-snug">
                              {clubName}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-medium">
                              Approved Club Organizer
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Organizer Name */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs flex-shrink-0">
                            {org.name ? org.name.charAt(0) : 'O'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">
                              {org.name || 'Unnamed Organizer'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {org.batch ? `${org.batch}` : ''}
                              {org.section ? ` • Sec ${org.section}` : ''}
                              {(org.level || org.term) ? ` • L${org.level || '-'}/T${org.term || '-'}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Student ID */}
                      <td className="py-3.5 px-4 align-middle">
                        {org.studentId ? (
                          <span className="inline-block px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                            {org.studentId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* Column 4: Department */}
                      <td className="py-3.5 px-4 align-middle">
                        {org.department ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                            {org.department}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* Column 5: Email */}
                      <td className="py-3.5 px-4 align-middle">
                        <div>
                          <a
                            href={`mailto:${org.email}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-xs text-[11px]"
                            title={org.email}
                          >
                            {org.email}
                          </a>
                          {org.mobileNumber && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📞 {org.mobileNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Action */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => setDemotingUser(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition shadow-2xs hover:shadow-xs active:scale-95"
                          title="Demote organizer back to student"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                          <span>Demote</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: Grouped by Club Cards */}
        {!loading && !error && viewMode === 'grouped' && (
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50/50">
            {Object.entries(groupedByClub)
              .filter(([club]) => selectedClub === 'ALL' || club === selectedClub)
              .filter(([club, list]) => {
                if (!searchTerm.trim()) return true;
                const query = searchTerm.toLowerCase();
                const matchesClub = club.toLowerCase().includes(query);
                const matchesAnyOrg = list.some(
                  (o) =>
                    (o.name || '').toLowerCase().includes(query) ||
                    (o.studentId || '').toLowerCase().includes(query) ||
                    (o.department || '').toLowerCase().includes(query) ||
                    (o.email || '').toLowerCase().includes(query)
                );
                return matchesClub || matchesAnyOrg;
              })
              .map(([club, orgList]) => {
                const count = orgList.length;
                const isFull = count >= 2;
                const hasSlots = count === 1;

                return (
                  <div
                    key={club}
                    className={`rounded-xl border p-4 bg-white shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                      isFull
                        ? 'border-emerald-300 ring-1 ring-emerald-100'
                        : hasSlots
                        ? 'border-indigo-200'
                        : 'border-slate-200 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Club Header & Capacity Pill */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏛️</span>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {club}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isFull
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : hasSlots
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {count}/2 Organizers
                        </span>
                      </div>

                      {/* Organizers List */}
                      <div className="space-y-2.5 my-3">
                        {count === 0 ? (
                          <div className="py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                            <span className="text-[11px] text-slate-400 italic">
                              No organizers assigned yet (2 slots available)
                            </span>
                          </div>
                        ) : (
                          orgList.map((org) => (
                            <div
                              key={org.id}
                              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center uppercase flex-shrink-0">
                                  {org.name ? org.name.charAt(0) : 'O'}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 text-xs block truncate">
                                    {org.name || 'Unnamed Organizer'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {org.studentId ? `ID: ${org.studentId} • ` : ''}
                                    {org.department || 'BAUST'}
                                  </span>
                                  <a
                                    href={`mailto:${org.email}`}
                                    className="text-[10px] text-blue-600 hover:underline block truncate"
                                  >
                                    {org.email}
                                  </a>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDemotingUser(org)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold transition flex-shrink-0"
                                title="Demote organizer"
                              >
                                Demote
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Capacity Footer */}
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Status:</span>
                      <span className="font-medium text-slate-600">
                        {isFull
                          ? 'Capacity Maximum (2/2)'
                          : hasSlots
                          ? '1 Open Organizer Slot'
                          : '2 Vacant Organizer Slots'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Table Footer with Summary */}
        {!loading && !error && filteredOrganizers.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Showing <span className="font-semibold text-slate-800">{filteredOrganizers.length}</span>{' '}
              approved organizer(s)
              {selectedClub !== 'ALL' && ` in ${selectedClub}`}
            </span>
            <span className="text-[11px] text-slate-400">
              BAUST Club Management Rules: Max 2 organizers per club
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Demoting an Organizer */}
      {demotingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3>Remove / Demote Organizer</h3>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to remove organizer privileges from{' '}
                <span className="font-semibold text-slate-900">{demotingUser.name || 'this user'}</span>?
              </p>
            </div>

            {/* Target Details Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Club Assignment:</span>
                <span className="font-bold text-indigo-700">
                  {demotingUser.clubName || demotingUser.clubAffiliation || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Email:</span>
                <span className="text-slate-800">{demotingUser.email}</span>
              </div>
              {demotingUser.studentId && (
                <div className="flex justify-between text-slate-500">
                  <span>Student ID:</span>
                  <span className="font-mono text-slate-800">{demotingUser.studentId}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>New Role:</span>
                <span className="font-semibold text-emerald-700">Student / Participant</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              This action will reset their organizer request status to <em>none</em>, remove club
              affiliation, and free up 1 organizer capacity slot for this club.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={processingDemote}
                onClick={() => setDemotingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingDemote}
                onClick={handleConfirmDemote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingDemote ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Demoting...</span>
                  </>
                ) : (
                  <span>Confirm Demote</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

