const isBrowser = typeof window !== 'undefined';

export const getStoredToken = () => {
  if (!isBrowser) {
    return null;
  }

  return localStorage.getItem('token');
};

export const getStoredUser = () => {
  if (!isBrowser) {
    return null;
  }

  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    return parsedUser && typeof parsedUser === 'object' ? parsedUser : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const clearStoredSession = () => {
  if (!isBrowser) {
    return;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getDefaultRouteForRole = (role) => {
  if (role === 'admin') return '/dashboard';
  if (role === 'counter') return '/billing';
  if (role === 'kitchen') return '/kitchen';
  return '/login';
};
