import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import userService from '../services/userService.js';
import ClubOrganizersDirectory from '../components/ClubOrganizersDirectory.jsx';

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Active tab synchronized with URL: 'all' | 'requests' | 'organizers'
  const activeTab = tabFromUrl === 'requests' || tabFromUrl === 'organizers' ? tabFromUrl : 'all';

  const setActiveTab = (newTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', newTab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const [users, setUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  // Filters for 'all' tab
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Mutation state
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Application Dossier Inspection Modal state
  const [viewingRequest, setViewingRequest] = useState(null);

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.organizerStatus = statusFilter;

      const [usersData, requestsData] = await Promise.all([
        userService.listUsers(params),
        userService.getOrganizerRequests().catch(() => []),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoleRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-open application dossier modal if requested via notification link with userId
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId && roleRequests.length > 0) {
      const targetReq = roleRequests.find((r) => r.id === targetUserId);
      if (targetReq) {
        setViewingRequest(targetReq);
      }
    }
  }, [searchParams, roleRequests]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      const payload = { role: newRole };
      if (newRole !== 'organizer') {
        payload.organizerStatus = 'none';
        payload.organizerRequestStatus = 'none';
        payload.clubAffiliation = null;
      } else {
        payload.organizerStatus = 'approved';
        payload.organizerRequestStatus = 'approved';
      }
      await userService.updateUserRole(userId, payload);
      showToast(`User role updated to ${newRole}`);
      await fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveRequest = async (userId, clubName) => {
    try {
      setUpdatingUserId(userId);
      await userService.approveOrganizer(userId);
      showToast(`Organizer approved successfully for ${clubName || 'club'}! User promoted to Organizer.`);
      await fetchUsers();
    } catch (err) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to approve organizer request';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      setUpdatingUserId(userId);
      await userService.rejectOrganizer(userId);
      showToast('Organizer request has been rejected.');
      await fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to reject organizer request', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rejectingUser) return;
    try {
      setUpdatingUserId(rejectingUser.id);
      await userService.rejectOrganizer(rejectingUser.id, rejectionReason.trim() || null);
      showToast('Organizer request has been rejected.');
      setRejectingUser(null);
      setRejectionReason('');
      await fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.message || 'Failed to reject organizer request', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#14213D] text-[#FCA311] border border-[#FCA311]/40">Admin</span>;
      case 'organizer':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#FCA311]/20 text-[#14213D] border border-[#FCA311]/50">Organizer</span>;
      case 'guest':
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">Guest</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-[#14213D] border border-[#E5E5E5]">Participant</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'pending':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Pending Review</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-500">None</span>;
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.batch?.toLowerCase().includes(term) ||
      u.clubAffiliation?.toLowerCase().includes(term)
    );
  });

  const pendingCount = roleRequests.length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in border ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#14213D] text-[#FCA311] border border-[#FCA311]/40">
              Admin Console
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage student roles, view registered cohorts, and review organizer privilege applications.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-[#14213D] text-[#FCA311] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-[#14213D] text-[#FCA311] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Role Requests</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FCA311] text-[#14213D] animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('organizers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'organizers'
                ? 'bg-[#14213D] text-[#FCA311] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Club Organizers</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ROLE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-semibold">Capacity Enforcement Policy</p>
              <p className="mt-0.5">
                Each campus club is strictly capped at a <strong>maximum of 2 organizers</strong>.
                If an approval is attempted for a club that already has 2 active organizers, the system will prevent the promotion and display a capacity notice.
              </p>
            </div>
          </div>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Loading pending requests...</p>
            </div>
          )}

          {!loading && roleRequests.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-2xl mb-3">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-800">No Pending Role Requests</h3>
              <p className="text-xs text-slate-500 mt-1">
                All club organizer applications have been reviewed. Check back later for new student submissions.
              </p>
            </div>
          )}

          {!loading && roleRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Academic Cohort</th>
                      <th className="py-3 px-4">Target Organization &amp; Role</th>
                      <th className="py-3 px-4">Application Details</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {roleRequests.map((reqUser) => {
                      const isUpdating = updatingUserId === reqUser.id;
                      const app = reqUser.organizerApplicationDetails || {};
                      const applicantName = app.name || reqUser.name || 'Student Applicant';
                      const applicantStudentId = app.studentId || reqUser.studentId;
                      const applicantBatch = app.batch || reqUser.batch;
                      const applicantDept = app.department || reqUser.department;
                      const applicantMobile = app.mobileNumber || reqUser.mobileNumber;
                      const requestedClub = app.clubAffiliation || reqUser.clubAffiliation || 'Unspecified Club';
                      const proposedDesignation = app.designation || reqUser.designation || 'Club Organizer';
                      const statement = app.reason || reqUser.bio || '';

                      return (
                        <tr key={reqUser.id} className="hover:bg-slate-50/70 transition">
                          {/* User */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {reqUser.photoURL ? (
                                  <img src={reqUser.photoURL} alt={applicantName} className="w-full h-full object-cover" />
                                ) : (
                                  applicantName ? applicantName.charAt(0) : 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">{applicantName}</span>
                                <span className="text-[11px] text-slate-400 block truncate">{reqUser.email}</span>
                                {applicantMobile && (
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <span>📞</span>
                                    <span>{applicantMobile}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Cohort */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              {applicantDept && (
                                <span className="font-semibold text-slate-800 block truncate max-w-xs">
                                  {applicantDept}
                                </span>
                              )}
                              <span className="font-medium text-slate-700 block">
                                {applicantStudentId ? `ID: ${applicantStudentId}` : ''}
                                {applicantBatch ? ` • ${applicantBatch}` : ''}
                                {reqUser.section ? ` • Sec ${reqUser.section}` : ''}
                              </span>
                              {(reqUser.level || reqUser.term) ? (
                                <span className="text-[11px] text-slate-500 block">
                                  {reqUser.level ? `L-${reqUser.level} ` : ''}
                                  {reqUser.term ? `T-${reqUser.term}` : ''}
                                </span>
                              ) : null}
                              {!applicantDept && !applicantStudentId && !applicantBatch && (
                                <span className="text-slate-400 italic">Not provided</span>
                              )}
                            </div>
                          </td>

                          {/* Club Affiliation & Role */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-[#E5E5E5] text-[#14213D] font-bold text-xs max-w-xs truncate">
                                <span>🏛️</span>
                                <span className="truncate">{requestedClub}</span>
                              </div>
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                                  <span>Proposed Role:</span>
                                  <strong>{proposedDesignation}</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Application Details / Statement */}
                          <td className="py-4 px-4">
                            {statement ? (
                              <div className="max-w-xs">
                                <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                                  "{statement}"
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setViewingRequest(reqUser)}
                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>📄 View Full Dossier</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewingRequest(reqUser)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                <span>👁️ Inspect Info</span>
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {getStatusBadge(reqUser.organizerRequestStatus || reqUser.organizerStatus || 'pending')}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingRequest(reqUser)}
                                className="p-1.5 text-slate-600 hover:text-[#14213D] hover:bg-slate-100 rounded-lg transition"
                                title="Inspect Full Application"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => handleApproveRequest(reqUser.id, requestedClub)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdating ? '...' : 'Approve'}
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => {
                                  setRejectingUser(reqUser);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL USERS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, batch, club..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                >
                  <option value="">All Roles</option>
                  <option value="participant">Participant</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Organizer Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                >
                  <option value="">All Organizer Statuses</option>
                  <option value="pending">Pending Review Only</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#FCA311] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Loading user records...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <p className="text-sm font-semibold text-rose-800">Error: {error}</p>
              <button
                onClick={fetchUsers}
                className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <h3 className="text-base font-bold text-slate-700">No users found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm || roleFilter || statusFilter
                  ? 'No users match your applied search filters.'
                  : 'No registered user documents exist in the database yet.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Cohort Details</th>
                      <th className="py-3 px-4">Club Affiliation</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Organizer Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredUsers.map((u) => {
                      const isUpdating = updatingUserId === u.id;
                      const userStatus = u.organizerRequestStatus || u.organizerStatus || 'none';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          {/* User Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] ring-1 ring-[#FCA311]/30 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name ? u.name.charAt(0) : 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">{u.name}</span>
                                <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Cohort */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {u.department && (
                                <span className="font-semibold text-slate-800 block truncate max-w-xs">
                                  {u.department}
                                </span>
                              )}
                              <span className="font-medium text-slate-700 block">
                                {u.studentId ? `ID: ${u.studentId}` : ''}
                                {u.batch ? ` • ${u.batch}` : ''}
                                {u.section ? ` • Sec ${u.section}` : ''}
                              </span>
                              {(u.level || u.term || u.mobileNumber) ? (
                                <span className="text-[11px] text-slate-500 block">
                                  {u.level ? `L-${u.level} ` : ''}
                                  {u.term ? `T-${u.term}` : ''}
                                  {u.mobileNumber ? ` • 📞 ${u.mobileNumber}` : ''}
                                </span>
                              ) : null}
                              {!u.department && !u.studentId && !u.batch && (
                                <span className="text-slate-400 italic">Not specified</span>
                              )}
                            </div>
                          </td>

                          {/* Club Affiliation */}
                          <td className="py-3.5 px-4">
                            {u.clubAffiliation ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                🏛️ {u.clubAffiliation}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>

                          {/* Role selection dropdown */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {getRoleBadge(u.role)}
                              <select
                                disabled={isUpdating}
                                value={u.role || 'participant'}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#FCA311] cursor-pointer disabled:opacity-50"
                              >
                                <option value="participant">Set: Participant</option>
                                <option value="organizer">Set: Organizer</option>
                                <option value="admin">Set: Admin</option>
                                <option value="guest">Set: Guest</option>
                              </select>
                            </div>
                          </td>

                          {/* Organizer Status */}
                          <td className="py-3.5 px-4">
                            <div>{getStatusBadge(userStatus)}</div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {userStatus === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={isUpdating}
                                  onClick={() => handleApproveRequest(u.id, u.clubAffiliation)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition shadow-sm disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={isUpdating}
                                  onClick={() => {
                                    setRejectingUser(u);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition shadow-sm disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLUB ORGANIZERS DIRECTORY */}
      {activeTab === 'organizers' && (
        <ClubOrganizersDirectory onNotify={showToast} />
      )}

      {/* Full Organizer Application Dossier Inspection Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-fade-in space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#14213D] text-[#FCA311] ring-2 ring-[#FCA311]/40 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {viewingRequest.photoURL ? (
                    <img src={viewingRequest.photoURL} alt={viewingRequest.name} className="w-full h-full object-cover" />
                  ) : (
                    viewingRequest.name ? viewingRequest.name.charAt(0) : 'U'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewingRequest.organizerApplicationDetails?.name || viewingRequest.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{viewingRequest.email}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Organizer Review
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Dossier Information Grid */}
            {(() => {
              const app = viewingRequest.organizerApplicationDetails || {};
              const applicantName = app.name || viewingRequest.name;
              const applicantStudentId = app.studentId || viewingRequest.studentId || 'N/A';
              const applicantDept = app.department || viewingRequest.department || 'N/A';
              const applicantBatch = app.batch || viewingRequest.batch || 'N/A';
              const applicantMobile = app.mobileNumber || viewingRequest.mobileNumber || 'N/A';
              const requestedClub = app.clubAffiliation || viewingRequest.clubAffiliation || 'Unspecified Club';
              const proposedDesignation = app.designation || viewingRequest.designation || 'Club Organizer';
              const statement = app.reason || viewingRequest.bio || '';
              const appliedAt = app.appliedAt ? new Date(app.appliedAt).toLocaleString() : null;

              return (
                <div className="space-y-4">
                  {/* Two column breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Applicant Legal Name</span>
                      <span className="font-bold text-slate-800 text-sm">{applicantName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Student ID &amp; Batch</span>
                      <span className="font-bold text-slate-800 text-sm">
                        ID: {applicantStudentId} • {applicantBatch}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Academic Department</span>
                      <span className="font-bold text-slate-800">{applicantDept}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Contact Phone Number</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <span>📞</span> {applicantMobile}
                      </span>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Target Club / Organization</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#14213D] text-[#FCA311] font-bold text-xs mt-0.5">
                          <span>🏛️</span>
                          <span>{requestedClub}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-semibold">Proposed Designation</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-xs mt-0.5">
                          <span>👔</span>
                          <span>{proposedDesignation}</span>
                        </span>
                      </div>
                    </div>
                    {appliedAt && (
                      <div className="sm:col-span-2 text-[11px] text-slate-400 pt-1">
                        Applied On: <strong className="text-slate-600">{appliedAt}</strong>
                      </div>
                    )}
                  </div>

                  {/* Statement of Purpose / Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Statement of Purpose &amp; Relevant Experience (Important Information):
                    </label>
                    <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs text-slate-800 leading-relaxed italic">
                      {statement ? `"${statement}"` : 'No statement provided by the applicant.'}
                    </div>
                  </div>

                  {/* Policy Reminder */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <div>
                      <strong>Administrative Policy Check:</strong> Maximum 2 organizers are allowed per club. Approving this candidate will grant them full organizer rights to publish events, manage tickets, and record club finances.
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewingRequest(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Close Dossier
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingRequest;
                          setViewingRequest(null);
                          setRejectingUser(target);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        Reject Application
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === viewingRequest.id}
                        onClick={async () => {
                          const target = viewingRequest;
                          setViewingRequest(null);
                          await handleApproveRequest(target.id, requestedClub);
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        {updatingUserId === viewingRequest.id ? 'Approving...' : 'Approve as Organizer'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Admin Rejection Modal with Quick Reasons */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Decline Organizer Request</h3>
                <p className="text-xs text-slate-500">
                  {rejectingUser.organizerApplicationDetails?.name || rejectingUser.name || rejectingUser.email}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Club:</span>
                <span className="font-semibold text-slate-800">
                  {rejectingUser.organizerApplicationDetails?.clubAffiliation || rejectingUser.clubAffiliation || 'Unspecified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{rejectingUser.email}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Decline (Administrative feedback for student)
                </label>

                {/* Quick Selection Buttons */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    'Capacity Full: Club already has 2 active organizers.',
                    'Incomplete credentials or student ID could not be verified.',
                    'Statement of purpose insufficient for organizer role.',
                    'Please coordinate with current club executives and advisor.',
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setRejectionReason(quick)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md border border-slate-200 text-left transition cursor-pointer"
                    >
                      {quick.slice(0, 38)}...
                    </button>
                  ))}
                </div>

                <textarea
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Club organizer quota of 2 is full, or please update your student profile."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingUser(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUserId === rejectingUser.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {updatingUserId === rejectingUser.id ? 'Processing...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
