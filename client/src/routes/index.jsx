import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Link, Navigate } from 'react-router-dom';
import api from '../services/api.js';
import LoginPage from '../pages/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
import EventDetailsPage from '../pages/EventDetailsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import FinancesPage from '../pages/FinancesPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    api
      .get('/health')
      .then((res) => {
        setHealth(res.data?.data || res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend server');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <div className="text-center mb-6">
          <span className="inline-block py-1 px-3 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider mb-2">
            BAUST Event System
          </span>
          <h1 className="text-2xl font-bold text-slate-800">BAUST Event System</h1>
          <p className="text-sm text-slate-500 mt-1">
            Express ESM + Cloud Firestore (Admin SDK) & React + Vite PWA
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
            >
              Open Dashboard ({user?.role})
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full text-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Sign In with Google
            </Link>
          )}

          <Link
            to="/events"
            className="w-full text-center py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            Browse Public Events
          </Link>
        </div>

        <div className="rounded-lg bg-slate-100 p-4 text-xs font-mono">
          <p className="font-semibold text-slate-700 mb-2">Backend Health Status (/api/v1/health):</p>
          {loading && <p className="text-slate-500">Connecting to server...</p>}
          {error && <p className="text-rose-600">Offline / Standby: {error}</p>}
          {health && (
            <pre className="text-emerald-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(health, null, 2)}
            </pre>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Bangladesh Army University of Science and Technology
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Application Routes using MainLayout
  {
    element: <MainLayout />,
    children: [
      // Publicly viewable event catalog & event details
      {
        path: '/events',
        element: <EventsPage />,
      },
      {
        path: '/events/:id',
        element: <EventDetailsPage />,
      },
      // Authenticated Protected Routes
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/finances',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'organizer']}>
            <FinancesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
