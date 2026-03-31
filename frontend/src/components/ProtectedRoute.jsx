import React from 'react';
import { Navigate } from 'react-router-dom';
import { getDefaultRouteForRole, getStoredToken, getStoredUser } from '../utils/session';

function ProtectedRoute({ children, roles }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
