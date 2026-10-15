import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [profileResult, setProfileResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiError, setApiError] = useState(null);

  const testProtectedApi = async () => {
    try {
      setTestingApi(true);
      setApiError(null);
      const res = await api.get('/auth/me');
      setProfileResult(res.data?.data || res.data);
    } catch (err) {
      setApiError(err.response?.data?.error?.message || err.message);
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider mb-2">
              Authenticated Session
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-medium transition border border-rose-200"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Assigned Role</span>
            <p className="text-lg font-bold text-slate-800 capitalize mt-1">{user?.role}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Organizer Status</span>
            <p className="text-lg font-bold text-slate-800 capitalize mt-1">{user?.organizerStatus || 'None'}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Issued Custom JWT:</h3>
          <div className="p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-lg break-all">
            {token}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Test Protected Backend API (/api/v1/auth/me):</h3>
          <button
            onClick={testProtectedApi}
            disabled={testingApi}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {testingApi ? 'Calling API...' : 'Verify JWT with Backend'}
          </button>

          {apiError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              Error: {apiError}
            </div>
          )}

          {profileResult && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono">
              <p className="text-emerald-800 font-semibold mb-2">Backend Profile Response Verified:</p>
              <pre className="text-emerald-900 whitespace-pre-wrap">
                {JSON.stringify(profileResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

