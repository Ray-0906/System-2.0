// utils/axios.js
import axios from 'axios';
import { useUserStore } from '../store/userStore';
import { useTrackerStore } from '../store/trackerStore';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}`,
  withCredentials: true,
});

// Central logout logic (non-hook version so it can be imported anywhere)
export const performClientLogout = () => {
  // Access store states directly without React hooks
  try {
    useUserStore.getState().reset();
    useTrackerStore.getState().reset?.();
  } catch (e) {
    console.warn('Store reset issue:', e);
  }
  localStorage.removeItem('user');
};

let isRefreshing = false; // Prevent multiple parallel logout triggers

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // Attempt server logout to clear cookie if still present
          try { await axiosInstance.get('/auth/logout'); } catch { /* ignore */ }
        } finally {
          performClientLogout();
          // Soft redirect without relying on react-router hook context
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
          setTimeout(() => { isRefreshing = false; }, 500);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
