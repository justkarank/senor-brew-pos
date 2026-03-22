import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the user's home screen based on their role
    if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
    if (user.role === 'counter') return <Navigate to="/billing" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
