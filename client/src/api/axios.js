import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the saved token is expired or invalid, end the session (AuthContext listens for this)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

// Remove empty fields so optional values are left out instead of sent as ""
export function dropEmpty(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ''));
}

// Turn any error into a simple message string
export function getError(err) {
  return err.response?.data?.error || 'Something went wrong. Please try again.';
}

export default api;
