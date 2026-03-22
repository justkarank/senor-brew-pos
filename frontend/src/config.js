const defaultApiUrl = 'http://localhost:5000';

export const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).trim();
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_URL).trim();
