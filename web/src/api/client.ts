import axios from 'axios';

// Dev: để trống VITE_API_URL → dùng /api/v1 (Vite proxy tới server), tránh trỏ nhầm URL deploy cũ
const raw = import.meta.env.VITE_API_URL?.trim() ?? '';
export const apiBaseUrl = raw !== '' ? raw.replace(/\/$/, '') : '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
