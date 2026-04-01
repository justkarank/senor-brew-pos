import axios from 'axios';
import { API_URL, IS_LOCAL_HOST, NEEDS_REMOTE_API_CONFIGURATION } from '../config';

const HEALTH_PATH = '/api/health';
const LOCAL_TIMEOUT_MS = 8000;
const REMOTE_TIMEOUT_MS = 60000;
const RECOVERABLE_NETWORK_CODES = new Set(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT']);

const buildUrl = (path) => `${API_URL || ''}${path}`;

export const getMissingApiConfigurationMessage = () =>
  'This Vercel deployment is missing VITE_API_URL/VITE_SOCKET_URL. Point both to your Render backend URL.';

export const isRecoverableNetworkError = (error) =>
  !error?.response && (!error?.code || RECOVERABLE_NETWORK_CODES.has(error.code));

export const getBackendConnectionMessage = (error, fallbackMessage) => {
  if (error?.code === 'MISSING_API_CONFIGURATION') {
    return error.message;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The backend is still waking up on Render. Please wait a few seconds and try again.';
  }

  if (isRecoverableNetworkError(error)) {
    return 'Unable to reach the backend. If Render was asleep, give it a moment to wake up and retry.';
  }

  return fallbackMessage;
};

export const warmUpBackend = async ({ timeout } = {}) => {
  if (NEEDS_REMOTE_API_CONFIGURATION) {
    const error = new Error(getMissingApiConfigurationMessage());
    error.code = 'MISSING_API_CONFIGURATION';
    throw error;
  }

  return axios.get(buildUrl(HEALTH_PATH), {
    timeout: timeout ?? (IS_LOCAL_HOST ? LOCAL_TIMEOUT_MS : REMOTE_TIMEOUT_MS),
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
};
