// utils/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}`, // Update to your backend URL
  withCredentials: true // Needed for cookies
});

export default axiosInstance;
