import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui/Spinner.jsx';

export const ProtectedRoute = ({ children, requireCompleteProfile = true }) => {
  const { user, loading, isProfileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force new users to complete their profile after first login
  if (requireCompleteProfile && !isProfileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile?complete=true" replace />;
  }

  return children;
};
