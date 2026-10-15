import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import api from '../services/api.js';

function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <h1 className="text-2xl font-bold text-slate-800">System Monorepo Ready</h1>
          <p className="text-sm text-slate-500 mt-1">
            Express ESM + Cloud Firestore (Admin SDK) & React + Vite PWA
          </p>
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
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

