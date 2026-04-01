import axios from 'axios';
import { API_URL } from './config';
import {
  getBackendConnectionMessage,
  isRecoverableNetworkError,
  warmUpBackend
} from './utils/backendConnection';
import { clearStoredSession, getStoredToken } from './utils/session';

const DEFAULT_TIMEOUT_MS = 20000;
const GET_RETRY_TIMEOUT_MS = 30000;

const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS
});

// Attach the JWT automatically when we have one.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle expired or invalid sessions in one place.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const requestMethod = error.config?.method?.toLowerCase();
    const requestUrl = String(error.config?.url || '');
    const alreadyRetried = Boolean(error.config?.__warmupRetried);

    if (
      requestMethod === 'get' &&
      !alreadyRetried &&
      !requestUrl.includes('/api/health') &&
      isRecoverableNetworkError(error)
    ) {
      try {
        await warmUpBackend();
        return api.request({
          ...error.config,
          __warmupRetried: true,
          timeout: Math.max(error.config?.timeout || DEFAULT_TIMEOUT_MS, GET_RETRY_TIMEOUT_MS)
        });
      } catch (warmupError) {
        return Promise.reject(warmupError);
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
  if (error?.code === 'MISSING_API_CONFIGURATION' || error?.code === 'DATABASE_UNAVAILABLE') {
    return error.message;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (!error.response) {
    return getBackendConnectionMessage(error, 'Unable to reach the server. Please check the backend connection.');
  }

  return fallbackMessage;
};

export default api;
