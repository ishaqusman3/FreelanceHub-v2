import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, userData, loading } = useAuth();

  console.log('Protected Route Check:', {
    currentUser: !!currentUser,
    userData,
    isAdmin: userData?.isAdmin,
    loading,
    requireAdmin
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !userData?.isAdmin) {
    console.log('User is not admin, redirecting...');
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute; 