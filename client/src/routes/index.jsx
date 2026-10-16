import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
import EventDetailsPage from '../pages/EventDetailsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import FinancesPage from '../pages/FinancesPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
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
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
