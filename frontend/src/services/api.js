import axios from 'axios';

// When running through Vite dev server or proxy, relative URL avoids CORS issues
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error messaging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMsg = 'An unexpected network or server error occurred.';
    if (error.response && error.response.data && error.response.data.detail) {
      errorMsg = error.response.data.detail;
    } else if (error.message) {
      errorMsg = error.message;
    }
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
