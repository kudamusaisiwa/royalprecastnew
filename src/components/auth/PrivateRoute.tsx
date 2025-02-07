import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuthStore();

  // If we're loading auth state, show nothing
  if (loading) {
    return null;
  }

  // If not authenticated and not loading, redirect to login
  if (!isAuthenticated) {
    // Don't redirect if trying to access the tracking page
    if (location.pathname === '/track') {
      return <>{children}</>;
    }
    
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
}