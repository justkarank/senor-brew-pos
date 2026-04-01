import axios from 'axios';
import { API_URL, IS_LOCAL_HOST, NEEDS_REMOTE_API_CONFIGURATION } from '../config';

const HEALTH_PATH = '/api/health';
const LOCAL_TIMEOUT_MS = 15000;
const REMOTE_TIMEOUT_MS = 90000;
const DEFAULT_RETRY_INTERVAL_MS = 2000;
const HEALTH_REQUEST_TIMEOUT_MS = 12000;
const RECOVERABLE_NETWORK_CODES = new Set(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT']);

const buildUrl = (path) => `${API_URL || ''}${path}`;
const createConnectionError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDatabaseUnavailableMessage = () =>
  'The backend is up, but MongoDB Atlas is unavailable. Check Atlas Network Access and your backend MONGO_URI.';

export const getLocalBackendUnreachableMessage = () =>
  `Local backend not reachable at ${API_URL || 'http://localhost:5000'}. Start npm run backend and check the backend terminal for MongoDB Atlas errors.`;

export const getMissingApiConfigurationMessage = () =>
  'This Vercel deployment is missing VITE_API_URL/VITE_SOCKET_URL. Point both to your Render backend URL.';

export const getInvalidBackendResponseMessage = () =>
  'The configured API URL did not return the Senor Brew backend health response. Check VITE_API_URL.';

export const isRecoverableNetworkError = (error) =>
  !error?.response && (!error?.code || RECOVERABLE_NETWORK_CODES.has(error.code));

export const getBackendConnectionMessage = (error, fallbackMessage) => {
  if (error?.code === 'MISSING_API_CONFIGURATION') {
    return error.message;
  }

  if (error?.code === 'DATABASE_UNAVAILABLE') {
    return error.message;
  }

  if (error?.code === 'INVALID_BACKEND_RESPONSE') {
    return error.message;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The backend is still waking up on Render. Please wait a few seconds and try again.';
  }

  if (isRecoverableNetworkError(error)) {
    return IS_LOCAL_HOST
      ? getLocalBackendUnreachableMessage()
      : 'Unable to reach the backend. If Render was asleep, give it a moment to wake up and retry.';
  }

  return fallbackMessage;
};

const getWarmUpTimeout = (timeout) => timeout ?? (IS_LOCAL_HOST ? LOCAL_TIMEOUT_MS : REMOTE_TIMEOUT_MS);

const fetchHealth = (timeout) =>
  axios.get(buildUrl(HEALTH_PATH), {
    timeout,
    params: {
      t: Date.now()
    }
  });

export const warmUpBackend = async ({ timeout } = {}) => {
  if (NEEDS_REMOTE_API_CONFIGURATION) {
    throw createConnectionError('MISSING_API_CONFIGURATION', getMissingApiConfigurationMessage());
  }

  const totalTimeout = getWarmUpTimeout(timeout);
  const deadline = Date.now() + totalTimeout;
  let lastError = createConnectionError(
    'DATABASE_UNAVAILABLE',
    getDatabaseUnavailableMessage()
  );

  while (Date.now() <= deadline) {
    try {
      const remainingMs = deadline - Date.now();
      const response = await fetchHealth(Math.min(HEALTH_REQUEST_TIMEOUT_MS, remainingMs));
      const databaseState = response.data?.database;

      if (!databaseState) {
        throw createConnectionError('INVALID_BACKEND_RESPONSE', getInvalidBackendResponseMessage());
      }

      if (databaseState === 'connected') {
        return response;
      }

      lastError = createConnectionError(
        'DATABASE_UNAVAILABLE',
        response.data?.message || getDatabaseUnavailableMessage()
      );
    } catch (error) {
      if (error?.code === 'INVALID_BACKEND_RESPONSE') {
        throw error;
      }

      lastError = error;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }

    await sleep(Math.min(DEFAULT_RETRY_INTERVAL_MS, remainingMs));
  }

  throw lastError;
};
