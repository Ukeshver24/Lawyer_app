import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route protection wrapper requiring user authentication.
 * If user is not logged in, redirects strictly to /login.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const userStr = localStorage.getItem('user');

  let isAuthenticated = false;
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && (parsed.id || parsed.mobile || parsed.name)) {
        isAuthenticated = true;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
