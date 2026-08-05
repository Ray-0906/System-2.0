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
    // Clear user but keep initialized=true (we know the state: logged out)
    // Setting initialized=false would cause infinite loading since useLoadUser won't re-run
    useUserStore.getState().setUser(null);
    useTrackerStore.getState().reset?.();
  } catch (e) {
    console.warn('Store reset issue:', e);
  }
  localStorage.removeItem('user');
};

let isRefreshing = false; // Prevent multiple parallel logout triggers

// Paths where a 401 is expected and should NOT trigger logout
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/google', '/auth/logout'];

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const requestUrl = error?.config?.url || '';
    const isAuthRoute = AUTH_PATHS.some((p) => requestUrl.includes(p));

    if (error?.response?.status === 401 && !isAuthRoute) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          try { await axiosInstance.get('/auth/logout'); } catch { /* ignore */ }
        } finally {
          performClientLogout();
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
