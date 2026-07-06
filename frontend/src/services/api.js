import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const sessionStr = localStorage.getItem('fg_auth_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (e) {
        console.error('Error parsing session data', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle 401s (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('fg_auth_session');
      window.dispatchEvent(new Event('fg_auth_expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
