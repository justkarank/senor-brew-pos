const defaultLocalApiUrl = 'http://127.0.0.1:5000';
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const isBrowser = typeof window !== 'undefined';

const normalizeUrl = (value = '') => value.trim().replace(/\/+$/, '');

const getFallbackApiUrl = () => {
  if (!isBrowser) {
    return defaultLocalApiUrl;
  }

  return localHosts.has(window.location.hostname) ? defaultLocalApiUrl : '';
};

const configuredApiUrl = normalizeUrl(import.meta.env.VITE_API_URL || '');
const configuredSocketUrl = normalizeUrl(import.meta.env.VITE_SOCKET_URL || '');

export const IS_LOCAL_HOST = isBrowser && localHosts.has(window.location.hostname);
export const NEEDS_REMOTE_API_CONFIGURATION = isBrowser && !IS_LOCAL_HOST && !configuredApiUrl;
export const API_URL = configuredApiUrl || getFallbackApiUrl();
export const SOCKET_URL = configuredSocketUrl || API_URL;
export const ENABLE_DEMO_LOGIN = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
