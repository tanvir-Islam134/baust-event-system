import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 text-blue-600 font-extrabold text-3xl mb-6 shadow-inner">
          404
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          The page you are looking for doesn't exist or has been moved. Check the URL or return back to the campus events portal.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            Go Back Home
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            Browse Events
          </Link>
        </div>
        <div className="mt-12 text-xs text-slate-400">
          BAUST Event Management System
        </div>
      </div>
    </div>
  );
}

