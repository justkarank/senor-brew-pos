import { API_URL, IS_LOCAL_HOST } from '../config';
import { getBackendConnectionMessage, warmUpBackend } from './backendConnection';
import { clearStoredSession, getStoredSession, setStoredSession } from './session';

const SESSION_VALIDATION_TTL_MS = 5 * 60 * 1000;
const SESSION_REQUEST_TIMEOUT_MS = 15000;

let validatedSession = {
  token: null,
  user: null,
  validatedAt: 0
};
let validationPromise = null;

const createSessionError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const readJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const fetchCurrentUser = async (token) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SESSION_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createSessionError(
        'ECONNABORTED',
        'Session validation timed out while waiting for the backend.'
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const resetSessionValidationCache = () => {
  validatedSession = {
    token: null,
    user: null,
    validatedAt: 0
  };
};

export const markSessionValidated = (token, user) => {
  validatedSession = {
    token,
    user,
    validatedAt: Date.now()
  };
};

export const validateStoredSession = async ({ force = false } = {}) => {
  const session = getStoredSession();

  if (!session) {
    resetSessionValidationCache();
    return { valid: false, reason: 'missing' };
  }

  const validationIsFresh =
    validatedSession.token === session.token &&
    Date.now() - validatedSession.validatedAt < SESSION_VALIDATION_TTL_MS;

  if (!force && validationIsFresh) {
    return {
      valid: true,
      user: validatedSession.user || session.user,
      fromCache: true
    };
  }

  if (!force && validationPromise) {
    return validationPromise;
  }

  validationPromise = (async () => {
    await warmUpBackend({ timeout: IS_LOCAL_HOST ? 12000 : 45000 });

    const response = await fetchCurrentUser(session.token);

    if (response.status === 401) {
      clearStoredSession();
      resetSessionValidationCache();
      return { valid: false, reason: 'unauthorized' };
    }

    if (!response.ok) {
      const data = await readJsonSafely(response);
      const error = createSessionError(
        response.status === 503 ? 'DATABASE_UNAVAILABLE' : 'SESSION_VALIDATION_FAILED',
        data?.message || 'Unable to validate your login session right now.'
      );
      error.status = response.status;
      throw error;
    }

    const data = await readJsonSafely(response);
    const user = data?.user;

    setStoredSession(session.token, user);
    markSessionValidated(session.token, user);

    return { valid: true, user };
  })().finally(() => {
    validationPromise = null;
  });

  return validationPromise;
};

export const getSessionValidationErrorMessage = (error) =>
  getBackendConnectionMessage(
    error,
    'Unable to confirm your login session right now. Please retry or sign in again.'
  );
