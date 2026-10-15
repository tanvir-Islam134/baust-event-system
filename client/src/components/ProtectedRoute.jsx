import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * ProtectedRoute component guarding routes requiring authentication and specific roles.
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Optional list of permitted roles (admin | organizer | participant | guest)
 * @param {React.ReactNode} [props.children] - Child components to render
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 border border-slate-200 text-center">
          <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">403 - Access Forbidden</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your role (<span className="font-semibold">{user.role}</span>) does not have permission to access this page.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

