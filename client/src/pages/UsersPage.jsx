import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService.js';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'requests'
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      await userService.updateUserRole(userId, { role: newRole });
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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'organizer':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Organizer</span>;
      case 'guest':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Guest</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Participant</span>;
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
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl flex items-start gap-3 animate-fade-in border ${
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
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Role Requests</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
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
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                      <th className="py-3 px-4">Requested Club</th>
                      <th className="py-3 px-4">Request Status</th>
                      <th className="py-3 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {roleRequests.map((reqUser) => {
                      const isUpdating = updatingUserId === reqUser.id;

                      return (
                        <tr key={reqUser.id} className="hover:bg-slate-50/70 transition">
                          {/* User */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {reqUser.name ? reqUser.name.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 block truncate">{reqUser.name}</span>
                                <span className="text-[11px] text-slate-400 block truncate">{reqUser.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Cohort */}
                          <td className="py-4 px-4">
                            {reqUser.batch || reqUser.section || reqUser.level ? (
                              <div className="space-y-0.5">
                                <span className="font-medium text-slate-800 block">
                                  {reqUser.batch || 'Batch unset'} {reqUser.section ? `• Sec ${reqUser.section}` : ''}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {reqUser.level ? `Level ${reqUser.level}` : ''} {reqUser.term ? `Term ${reqUser.term}` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not provided</span>
                            )}
                          </td>

                          {/* Club Affiliation */}
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-xs">
                              <span>🏛️</span>
                              <span>{reqUser.clubAffiliation || 'Unspecified Club'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {getStatusBadge(reqUser.organizerRequestStatus || reqUser.organizerStatus || 'pending')}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={isUpdating}
                                onClick={() => handleApproveRequest(reqUser.id, reqUser.clubAffiliation)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                {isUpdating ? 'Checking...' : 'Approve'}
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() => handleRejectRequest(reqUser.id)}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                {isUpdating ? '...' : 'Reject'}
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
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">{u.name}</span>
                                <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Cohort */}
                          <td className="py-3.5 px-4">
                            {u.batch || u.section || u.level ? (
                              <div className="space-y-0.5">
                                <span className="font-medium text-slate-800 block">
                                  {u.batch || 'Batch unset'} {u.section ? `• Sec ${u.section}` : ''}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {u.level ? `Level ${u.level}` : ''} {u.term ? `Term ${u.term}` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not specified</span>
                            )}
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
                                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
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
                                  onClick={() => handleRejectRequest(u.id)}
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
    </div>
  );
}
