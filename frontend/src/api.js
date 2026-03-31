import axios from 'axios';
import { API_URL } from './config';
import { clearStoredSession, getStoredToken } from './utils/session';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
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
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
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
    return 'Unable to reach the server. Please check the backend connection.';
  }

  return fallbackMessage;
};

export default api;
