import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase.js';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
   * Google Sign-in flow:
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
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
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

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    loginWithGoogle,
    logout,
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

