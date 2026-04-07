const isBrowser = typeof window !== 'undefined';
const VALID_ROLES = new Set(['admin', 'counter', 'kitchen']);

const isValidStoredUser = (value) =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    VALID_ROLES.has(value.role)
  );

const parseJwtPayload = (token) => {
  if (!isBrowser || typeof token !== 'string') {
    return null;
  }

  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    const normalizedPayload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const decodedPayload = window.atob(paddedPayload);
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token, bufferSeconds = 30) => {
  const payload = parseJwtPayload(token);
  const expiresAt = Number(payload?.exp);

  if (!Number.isFinite(expiresAt)) {
    return true;
  }

  return expiresAt * 1000 <= Date.now() + bufferSeconds * 1000;
};

export const setStoredSession = (token, user) => {
  if (!isBrowser || typeof token !== 'string' || !token.trim() || !isValidStoredUser(user)) {
    return;
  }

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredSession = () => {
  if (!isBrowser) {
    return null;
  }

  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token || !rawUser || isTokenExpired(token)) {
    clearStoredSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);

    if (!isValidStoredUser(parsedUser)) {
      clearStoredSession();
      return null;
    }

    return {
      token,
      user: parsedUser
    };
  } catch {
    clearStoredSession();
    return null;
  }
};

export const getStoredToken = () => {
  return getStoredSession()?.token || null;
};

export const getStoredUser = () => {
  return getStoredSession()?.user || null;
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
