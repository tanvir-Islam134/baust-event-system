import React from 'react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AppRouter } from './routes/index.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
