const defaultLocalApiUrl = 'http://localhost:5000';
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeUrl = (value = '') => value.trim().replace(/\/+$/, '');

const getFallbackApiUrl = () => {
  if (typeof window === 'undefined') {
    return defaultLocalApiUrl;
  }

  return localHosts.has(window.location.hostname)
    ? defaultLocalApiUrl
    : window.location.origin;
};

const configuredApiUrl = normalizeUrl(import.meta.env.VITE_API_URL || '');
const configuredSocketUrl = normalizeUrl(import.meta.env.VITE_SOCKET_URL || '');

export const API_URL = configuredApiUrl || getFallbackApiUrl();
export const SOCKET_URL = configuredSocketUrl || API_URL;
