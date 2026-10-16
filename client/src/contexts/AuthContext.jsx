import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase.js';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const profile = res.data?.data || res.data;
      setUser(profile);
      return profile;
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh user profile:', err.message);
      return null;
    }
  }, []);

  // Initialize and verify stored session on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data?.data || res.data);
          setToken(storedToken);
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err.message);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to global 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Google Sign-in flow (Existing users only):
   * 1. Trigger Firebase Web SDK Google Auth popup
   * 2. Obtain Firebase ID token
   * 3. Exchange with backend /api/v1/auth/login for custom JWT and user profile
   * 4. Persist custom JWT to localStorage and state
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleAuthProvider);
      const firebaseToken = await result.user.getIdToken();

      const response = await api.post('/auth/login', { firebaseToken });
      const { token: customToken, user: userProfile } = response.data.data;

      localStorage.setItem('token', customToken);
      setToken(customToken);
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      // Immediately clear Firebase session on failure
      try {
        await signOut(auth);
      } catch (signOutErr) {
        // ignore
      }
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign-up / Registration flow (New user creation):
   * 1. Trigger Firebase Web SDK Google Auth popup
   * 2. Obtain Firebase ID token
   * 3. Call backend /api/v1/auth/register to create user in database
   * 4. Persist custom JWT to localStorage and state
   */
  const registerWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleAuthProvider);
      const firebaseToken = await result.user.getIdToken();

      const response = await api.post('/auth/register', { firebaseToken });
      const { token: customToken, user: userProfile } = response.data.data;

      localStorage.setItem('token', customToken);
      setToken(customToken);
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      try {
        await signOut(auth);
      } catch (signOutErr) {
        // ignore
      }
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete registration with student/organizer profile form data.
   * Sends { firebaseToken, ...details } to /api/v1/auth/register,
   * stores custom JWT, and sets user state.
   */
  const completeRegistration = async (registrationPayload) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/register', registrationPayload);
      const { token: customToken, user: userProfile } = response.data.data;

      localStorage.setItem('token', customToken);
      setToken(customToken);
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      try {
        await signOut(auth);
      } catch (signOutErr) {
        // ignore
      }
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout flow:
   * Cleans up Firebase Auth session, localStorage custom JWT, and React state.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[AuthContext] Firebase signOut warning:', err.message);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  };

  /**
   * Account Deletion flow:
   * Calls backend DELETE /users/me, cleans up Firebase Auth session,
   * removes localStorage custom JWT, and clears React state.
   */
  const deleteAccount = async () => {
    try {
      await api.delete('/users/me');
    } finally {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[AuthContext] Firebase signOut warning after delete:', err.message);
      }
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  };

  const isPendingOrganizer =
    !!user &&
    (user.organizerRequestStatus === 'pending' || user.organizerStatus === 'pending') &&
    user.role !== 'organizer' &&
    user.role !== 'admin';

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    isPendingOrganizer,
    loginWithGoogle,
    registerWithGoogle,
    completeRegistration,
    logout,
    deleteAccount,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
